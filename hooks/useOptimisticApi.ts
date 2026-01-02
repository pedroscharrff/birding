import { useState, useCallback } from 'react'
import { useToast } from './useToast'

interface UseOptimisticUpdateOptions<T> {
  endpoint: string
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useOptimisticUpdate<T = any>() {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const update = useCallback(
    async <D = any>(
      options: UseOptimisticUpdateOptions<T> & {
        optimisticData: D
        updateFn: (data: D) => void
        rollbackFn: () => void
        payload: any
      }
    ) => {
      const {
        endpoint,
        optimisticData,
        updateFn,
        rollbackFn,
        payload,
        onSuccess,
        onError,
        successMessage,
        errorMessage,
      } = options

      // 1. ATUALIZAÇÃO OTIMISTA - muda imediatamente na UI
      updateFn(optimisticData)
      setIsUpdating(true)

      try {
        // 2. SINCRONIZAR COM SERVIDOR em background
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        const contentType = res.headers.get('content-type') || ''
        let payloadRes: any = null
        let rawText: string | null = null
        try {
          if (contentType.includes('application/json')) {
            payloadRes = await res.json()
          } else {
            rawText = await res.text()
            payloadRes = rawText ? { message: rawText } : null
          }
        } catch (e) {
          payloadRes = null
        }

        const hasEnvelope = payloadRes && typeof payloadRes.success === 'boolean'
        const isSuccess = res.ok && (!hasEnvelope || payloadRes.success)

        if (!isSuccess) {
          const message = (hasEnvelope && (payloadRes.error || payloadRes.message)) ||
            (payloadRes && (payloadRes.error || payloadRes.message)) ||
            res.statusText ||
            errorMessage ||
            'Erro ao atualizar'
          throw new Error(`${message}${res.status ? ` (HTTP ${res.status})` : ''}`)
        }

        // Sucesso - UI já está atualizada!
        if (successMessage) {
          toast({
            title: 'Sucesso',
            description: successMessage,
            variant: 'success',
          })
        }

        if (onSuccess) {
          onSuccess(hasEnvelope ? payloadRes.data : payloadRes)
        }

        return hasEnvelope ? payloadRes.data : payloadRes
      } catch (error: any) {
        // 3. ROLLBACK - se falhar, volta ao estado anterior
        rollbackFn()

        toast({
          title: 'Erro',
          description: error.message || errorMessage || 'Erro ao atualizar',
          variant: 'destructive',
        })

        if (onError) {
          onError(error)
        }

        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [toast]
  )

  return { update, isUpdating }
}

// Hook específico para mutação otimista de dados
export function useOptimisticMutation<T = any>() {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const mutate = useCallback(
    async (options: {
      endpoint: string
      method?: 'POST' | 'PATCH' | 'DELETE'
      payload?: any
      optimisticUpdate?: (currentData: T | null) => T | null
      successMessage?: string
      onSuccess?: (data: T) => void
    }) => {
      const {
        endpoint,
        method = 'PATCH',
        payload,
        optimisticUpdate,
        successMessage,
        onSuccess,
      } = options

      const previousData = data

      // Atualização otimista
      if (optimisticUpdate) {
        setData(optimisticUpdate(data))
      }

      setIsLoading(true)

      try {
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: payload ? JSON.stringify(payload) : undefined,
        })

        const contentType = res.headers.get('content-type') || ''
        let result: any = null
        let rawText: string | null = null
        try {
          if (contentType.includes('application/json')) {
            result = await res.json()
          } else {
            rawText = await res.text()
            result = rawText ? { message: rawText } : null
          }
        } catch (e) {
          result = null
        }

        const hasEnvelope = result && typeof result.success === 'boolean'
        const isSuccess = res.ok && (!hasEnvelope || result.success)

        if (!isSuccess) {
          const message = (hasEnvelope && (result.error || result.message)) ||
            (result && (result.error || result.message)) ||
            res.statusText ||
            'Erro na requisição'
          throw new Error(`${message}${res.status ? ` (HTTP ${res.status})` : ''}`)
        }

        const finalData = hasEnvelope ? result.data : result
        setData(finalData)

        if (successMessage) {
          toast({
            title: 'Sucesso',
            description: successMessage,
            variant: 'success',
          })
        }

        if (onSuccess) {
          onSuccess(finalData)
        }

        return finalData
      } catch (error: any) {
        // Rollback
        setData(previousData)

        toast({
          title: 'Erro',
          description: error.message,
          variant: 'destructive',
        })

        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [data, toast]
  )

  return { data, setData, mutate, isLoading }
}
