import { useState, useEffect, useCallback } from 'react'

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: any
  autoFetch?: boolean
  unwrapData?: boolean // when false, set data to full JSON response
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  execute: (body?: any) => Promise<T>
}

export function useApi<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { method = 'GET', body, autoFetch = true, unwrapData = true } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(
    async (requestBody?: any) => {
      setLoading(true)
      setError(null)

      try {
        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }

        if (requestBody || body) {
          fetchOptions.body = JSON.stringify(requestBody || body)
        }

        const res = await fetch(endpoint, fetchOptions)
        const contentType = res.headers.get('content-type') || ''
        let payload: any = null
        let rawText: string | null = null
        try {
          if (contentType.includes('application/json')) {
            payload = await res.json()
          } else {
            rawText = await res.text()
            payload = rawText ? { message: rawText } : null
          }
        } catch (e) {
          // Se não for possível fazer parse, mantém payload como null e continua usando statusText
          payload = null
        }

        const hasEnvelope = payload && typeof payload.success === 'boolean'
        const isSuccess = res.ok && (!hasEnvelope || payload.success)

        if (!isSuccess) {
          const message = (hasEnvelope && (payload.error || payload.message)) ||
            (payload && (payload.error || payload.message)) ||
            res.statusText ||
            'Erro na requisição'
          throw new Error(`${message}${res.status ? ` (HTTP ${res.status})` : ''}`)
        }

        const value = unwrapData ? (hasEnvelope ? payload.data : payload) : payload
        setData(value)
        return value
      } catch (err: any) {
        const errorMessage = err.message || 'Erro inesperado'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [endpoint, method, body, unwrapData]
  )

  useEffect(() => {
    if (autoFetch && method === 'GET') {
      fetchData()
    }
  }, [autoFetch, method, fetchData])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  const execute = useCallback(
    async (requestBody?: any) => {
      return await fetchData(requestBody)
    },
    [fetchData]
  )

  return { data, loading, error, refetch, execute }
}

// Hook específico para listas paginadas
interface PaginatedData<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function usePaginatedApi<T = any>(
  endpoint: string,
  queryParams: Record<string, any> = {}
) {
  const buildUrl = () => {
    const params = new URLSearchParams()
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    return `${endpoint}?${params.toString()}`
  }

  return useApi<PaginatedData<T>>(buildUrl(), { autoFetch: true, unwrapData: false })
}

