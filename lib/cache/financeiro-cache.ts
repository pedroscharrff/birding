/**
 * Cache para dados financeiros
 * Reduz carga no banco de dados e melhora performance
 */

import { getRedisClient } from './redis'

const CACHE_PREFIX = 'financeiro'

/**
 * TTLs (Time To Live) em segundos
 */
export const FINANCEIRO_CACHE_TTL = {
  resumo: 5 * 60,        // 5 minutos
  fluxoCaixa: 10 * 60,   // 10 minutos
  dashboard: 3 * 60,     // 3 minutos
} as const

/**
 * Gera chave de cache para resumo financeiro
 */
export function getResumoFinanceiroCacheKey(orgId: string, periodo: string): string {
  return `${CACHE_PREFIX}:resumo:${orgId}:${periodo}`
}

/**
 * Gera chave de cache para fluxo de caixa
 */
export function getFluxoCaixaCacheKey(orgId: string, meses: number): string {
  return `${CACHE_PREFIX}:fluxo:${orgId}:${meses}`
}

/**
 * Busca resumo financeiro do cache
 */
export async function getResumoFinanceiroCache(orgId: string, periodo: string): Promise<any | null> {
  try {
    const redis = getRedisClient()
    const key = getResumoFinanceiroCacheKey(orgId, periodo)
    const cached = await redis.get(key)
    
    if (cached) {
      return JSON.parse(cached)
    }
    
    return null
  } catch (error) {
    console.error('[Cache] Erro ao buscar resumo financeiro:', error)
    return null
  }
}

/**
 * Salva resumo financeiro no cache
 */
export async function setResumoFinanceiroCache(
  orgId: string, 
  periodo: string, 
  data: any
): Promise<void> {
  try {
    const redis = getRedisClient()
    const key = getResumoFinanceiroCacheKey(orgId, periodo)
    await redis.setex(key, FINANCEIRO_CACHE_TTL.resumo, JSON.stringify(data))
  } catch (error) {
    console.error('[Cache] Erro ao salvar resumo financeiro:', error)
  }
}

/**
 * Busca fluxo de caixa do cache
 */
export async function getFluxoCaixaCache(orgId: string, meses: number): Promise<any | null> {
  try {
    const redis = getRedisClient()
    const key = getFluxoCaixaCacheKey(orgId, meses)
    const cached = await redis.get(key)
    
    if (cached) {
      return JSON.parse(cached)
    }
    
    return null
  } catch (error) {
    console.error('[Cache] Erro ao buscar fluxo de caixa:', error)
    return null
  }
}

/**
 * Salva fluxo de caixa no cache
 */
export async function setFluxoCaixaCache(
  orgId: string, 
  meses: number, 
  data: any
): Promise<void> {
  try {
    const redis = getRedisClient()
    const key = getFluxoCaixaCacheKey(orgId, meses)
    await redis.setex(key, FINANCEIRO_CACHE_TTL.fluxoCaixa, JSON.stringify(data))
  } catch (error) {
    console.error('[Cache] Erro ao salvar fluxo de caixa:', error)
  }
}

/**
 * Invalida cache financeiro de uma organização
 */
export async function invalidateFinanceiroCache(orgId: string): Promise<void> {
  try {
    const redis = getRedisClient()
    const pattern = `${CACHE_PREFIX}:*:${orgId}:*`
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redis.del(key)))
      console.log(`[Cache] Invalidados ${keys.length} caches financeiros para org ${orgId}`)
    }
  } catch (error) {
    console.error('[Cache] Erro ao invalidar cache financeiro:', error)
  }
}
