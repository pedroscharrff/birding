"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface DeleteOSDialogProps {
  osId: string
  tituloOS?: string
}

export function DeleteOSDialog({ osId, tituloOS = 'esta OS' }: DeleteOSDialogProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.roleGlobal === 'admin') {
          setIsAdmin(true)
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    } finally {
      setIsLoadingAuth(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/os/${osId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: 'OS Deletada',
          description: 'A ordem de serviço foi removida com sucesso.',
        })
        setOpen(false)
        router.push('/dashboard/os')
        router.refresh()
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Não foi possível deletar a OS.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting OS:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao tentar deletar a OS.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Se não for admin ou estiver carregando check de auth, não renderiza nada
  if (isLoadingAuth || !isAdmin) {
    return null
  }

  return (
    <>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Deletar OS
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="py-2">
              Você tem certeza que deseja deletar a OS <strong>{tituloOS}</strong>?
              <br /><br />
              Esta ação moverá a OS para a lixeira e registrará o evento nos logs de auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
