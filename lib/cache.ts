type CacheValue = { value: unknown; expiresAt?: number }

class SimpleCache {
  private store = new Map<string, CacheValue>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value as T
  }

  set(key: string, value: unknown, ttlMs?: number): void {
    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined
    this.store.set(key, { value, expiresAt })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

export const cache = new SimpleCache()
