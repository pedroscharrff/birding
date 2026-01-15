import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Hook para atualização automática de dados após mutações
 * Combina router.refresh() com callback customizado para garantir atualização em tempo real
 */
export function useAutoRefresh() {
  const router = useRouter()

  const refresh = useCallback(
    (customRefetch?: () => void | Promise<void>) => {
      // Revalidar cache do Next.js
      router.refresh()
      
      // Executar refetch customizado se fornecido
      if (customRefetch) {
        customRefetch()
      }
    },
    [router]
  )

  return { refresh }
}
