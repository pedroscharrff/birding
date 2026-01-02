/**
 * Redis Client Configuration
 *
 * Este módulo configura e exporta um cliente Redis para cache de auditoria.
 * O Redis é usado para:
 * - Cache de logs recentes (últimas 24h)
 * - Estatísticas agregadas de auditoria
 * - Reduzir carga no PostgreSQL
 */

// Interface para o cliente Redis (compatível com ioredis ou node-redis)
interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ex?: number): Promise<string | null>
  setex(key: string, seconds: number, value: string): Promise<string | null>
  del(key: string): Promise<number>
  exists(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  ttl(key: string): Promise<number>
  lpush(key: string, ...values: string[]): Promise<number>
  lrange(key: string, start: number, stop: number): Promise<string[]>
  ltrim(key: string, start: number, stop: number): Promise<string>
  zadd(key: string, score: number, member: string): Promise<number>
  zrange(key: string, start: number, stop: number): Promise<string[]>
  zrevrange(key: string, start: number, stop: number, withscores?: string): Promise<string[]>
  zincrby(key: string, increment: number, member: string): Promise<string>
  incr(key: string): Promise<number>
  incrby(key: string, increment: number): Promise<number>
  keys(pattern: string): Promise<string[]>
  flushall(): Promise<string>
}

/**
 * Mock Redis Client para desenvolvimento/fallback
 * Implementa interface básica do Redis em memória
 */
class MockRedisClient implements RedisClient {
  private store: Map<string, { value: any; expireAt?: number }> = new Map()

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key)
      return null
    }
    return typeof item.value === 'string' ? item.value : JSON.stringify(item.value)
  }

  async set(key: string, value: string, ex?: number): Promise<string | null> {
    const expireAt = ex ? Date.now() + ex * 1000 : undefined
    this.store.set(key, { value, expireAt })
    return 'OK'
  }

  async setex(key: string, seconds: number, value: string): Promise<string | null> {
    return this.set(key, value, seconds)
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key)
    if (!item) return 0
    item.expireAt = Date.now() + seconds * 1000
    return 1
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key)
    if (!item) return -2
    if (!item.expireAt) return -1
    return Math.floor((item.expireAt - Date.now()) / 1000)
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    const item = this.store.get(key)
    const list = item?.value || []
    list.unshift(...values)
    this.store.set(key, { value: list, expireAt: item?.expireAt })
    return list.length
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const item = this.store.get(key)
    if (!item || !Array.isArray(item.value)) return []
    return item.value.slice(start, stop === -1 ? undefined : stop + 1)
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    const item = this.store.get(key)
    if (!item || !Array.isArray(item.value)) return 'OK'
    item.value = item.value.slice(start, stop === -1 ? undefined : stop + 1)
    return 'OK'
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    const item = this.store.get(key)
    const zset = item?.value || []
    const index = zset.findIndex((m: any) => m.member === member)
    if (index >= 0) {
      zset[index].score = score
      return 0
    }
    zset.push({ score, member })
    this.store.set(key, { value: zset, expireAt: item?.expireAt })
    return 1
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const item = this.store.get(key)
    if (!item || !Array.isArray(item.value)) return []
    const sorted = item.value.sort((a: any, b: any) => a.score - b.score)
    return sorted.slice(start, stop === -1 ? undefined : stop + 1).map((m: any) => m.member)
  }

  async zrevrange(key: string, start: number, stop: number, withscores?: string): Promise<string[]> {
    const item = this.store.get(key)
    if (!item || !Array.isArray(item.value)) return []
    const sorted = item.value.sort((a: any, b: any) => b.score - a.score)
    const slice = sorted.slice(start, stop === -1 ? undefined : stop + 1)
    if (withscores === 'WITHSCORES') {
      return slice.flatMap((m: any) => [m.member, String(m.score)])
    }
    return slice.map((m: any) => m.member)
  }

  async zincrby(key: string, increment: number, member: string): Promise<string> {
    const item = this.store.get(key)
    const zset = item?.value || []
    const index = zset.findIndex((m: any) => m.member === member)
    if (index >= 0) {
      zset[index].score += increment
      return String(zset[index].score)
    }
    zset.push({ score: increment, member })
    this.store.set(key, { value: zset, expireAt: item?.expireAt })
    return String(increment)
  }

  async incr(key: string): Promise<number> {
    return this.incrby(key, 1)
  }

  async incrby(key: string, increment: number): Promise<number> {
    const item = this.store.get(key)
    const value = item?.value ? Number(item.value) + increment : increment
    this.store.set(key, { value: String(value), expireAt: item?.expireAt })
    return value
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return Array.from(this.store.keys()).filter(key => regex.test(key))
  }

  async flushall(): Promise<string> {
    this.store.clear()
    return 'OK'
  }
}

/**
 * Cria e retorna um cliente Redis
 * Se REDIS_URL não estiver configurada, retorna um MockClient
 */
function createRedisClient(): RedisClient {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    console.warn('[Redis] REDIS_URL não configurada. Usando MockRedisClient (memória).')
    return new MockRedisClient()
  }

  // Quando Redis estiver disponível, você pode descomentar isso:
  /*
  try {
    const Redis = require('ioredis')
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError(err) {
        console.error('[Redis] Reconnect on error:', err.message)
        return true
      }
    })

    client.on('error', (error: Error) => {
      console.error('[Redis] Client error:', error)
    })

    client.on('connect', () => {
      console.log('[Redis] Connected successfully')
    })

    return client
  } catch (error) {
    console.error('[Redis] Failed to create client:', error)
    return new MockRedisClient()
  }
  */

  // Por enquanto, sempre usar mock até instalar ioredis
  console.warn('[Redis] Usando MockRedisClient. Instale "ioredis" para usar Redis real.')
  return new MockRedisClient()
}

// Singleton do cliente Redis
let redisClient: RedisClient | null = null

/**
 * Retorna a instância singleton do cliente Redis
 */
export function getRedisClient(): RedisClient {
  if (!redisClient) {
    redisClient = createRedisClient()
  }
  return redisClient
}

/**
 * Cache keys para auditoria
 */
export const AUDIT_CACHE_KEYS = {
  // Lista recente de auditorias de uma OS (últimas 24h)
  recentLogs: (osId: string) => `audit:os:${osId}:recent`,

  // Estatísticas de uma OS
  stats: (osId: string) => `audit:os:${osId}:stats`,

  // Contadores de ações por usuário
  userActions: (osId: string) => `audit:os:${osId}:users`,

  // Contadores de ações por entidade
  entityActions: (osId: string) => `audit:os:${osId}:entities`,

  // Lock para prevenir duplicação
  lock: (key: string) => `audit:lock:${key}`,
} as const

/**
 * TTLs (Time To Live) em segundos
 */
export const AUDIT_CACHE_TTL = {
  recentLogs: 24 * 60 * 60, // 24 horas
  stats: 1 * 60 * 60,       // 1 hora
  counters: 24 * 60 * 60,   // 24 horas
  lock: 10,                  // 10 segundos
} as const

export type { RedisClient }
