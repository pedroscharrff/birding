/**
 * Cache de Alertas
 *
 * Sistema de cache em memória para contadores de alertas
 * com invalidação automática e TTL configurável.
 */

import { AlertsResponse } from '@/types/alerts'

interface CacheEntry {
  data: AlertsResponse
  timestamp: number
  ttl: number
}

class AlertsCache {
  private cache: Map<string, CacheEntry>
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutos

  constructor() {
    this.cache = new Map()

    // Limpar entradas expiradas a cada minuto
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  /**
   * Obtém alertas do cache
   */
  get(orgId: string): AlertsResponse | null {
    const entry = this.cache.get(orgId)

    if (!entry) {
      return null
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(orgId)
      return null
    }

    return entry.data
  }

  /**
   * Armazena alertas no cache
   */
  set(orgId: string, data: AlertsResponse, ttl?: number): void {
    this.cache.set(orgId, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  /**
   * Invalida cache de uma organização
   */
  invalidate(orgId: string): void {
    this.cache.delete(orgId)
  }

  /**
   * Invalida todo o cache
   */
  invalidateAll(): void {
    this.cache.clear()
  }

  /**
   * Remove entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    size: number
    entries: Array<{ orgId: string; age: number; ttl: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([orgId, entry]) => ({
      orgId,
      age: now - entry.timestamp,
      ttl: entry.ttl,
    }))

    return {
      size: this.cache.size,
      entries,
    }
  }
}

// Singleton global
export const alertsCache = new AlertsCache()
