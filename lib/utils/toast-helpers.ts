/**
 * Helpers para Toast Notifications
 *
 * Funções utilitárias para facilitar o uso de toasts em toda a aplicação.
 */

import { toast } from '@/hooks/useToast'

export const toastHelpers = {
  /**
   * Toast de sucesso
   */
  success: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'success',
    })
  },

  /**
   * Toast de erro
   */
  error: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'destructive',
    })
  },

  /**
   * Toast de aviso
   */
  warning: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'warning',
    })
  },

  /**
   * Toast informativo
   */
  info: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'default',
    })
  },

  /**
   * Toast para operações assíncronas
   */
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    const loadingToast = toast({
      title: messages.loading,
      variant: 'default',
    })

    try {
      const data = await promise
      loadingToast.dismiss()

      const successMessage = typeof messages.success === 'function'
        ? messages.success(data)
        : messages.success

      toast({
        title: successMessage,
        variant: 'success',
      })

      return data
    } catch (error) {
      loadingToast.dismiss()

      const errorMessage = typeof messages.error === 'function'
        ? messages.error(error)
        : messages.error

      toast({
        title: errorMessage,
        variant: 'destructive',
      })

      throw error
    }
  },
}

// Exportar também como funções standalone
export const { success, error, warning, info, promise: promiseToast } = toastHelpers
