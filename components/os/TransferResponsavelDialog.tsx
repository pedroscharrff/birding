"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserCog, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface Usuario {
  id: string
  nome: string
  email: string
  roleGlobal: string
}

interface TransferResponsavelDialogProps {
  osId: string
  agenteAtual: {
    id: string
    nome: string
    email: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TransferResponsavelDialog({
  osId,
  agenteAtual,
  open,
  onOpenChange,
  onSuccess,
}: TransferResponsavelDialogProps) {
  const [agentes, setAgentes] = useState<Usuario[]>([])
  const [selectedAgenteId, setSelectedAgenteId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Buscar lista de agentes quando o diálogo abrir
  useEffect(() => {
    if (open) {
      fetchAgentes()
    }
  }, [open])

  const fetchAgentes = async () => {
    setIsFetching(true)
    try {
      const response = await fetch('/api/usuarios?roles=admin,agente&ativo=true')
      const data = await response.json()

      if (data.success) {
        // Filtrar o agente atual da lista
        const agentesDisponiveis = data.data.filter(
          (agente: Usuario) => agente.id !== agenteAtual.id
        )
        setAgentes(agentesDisponiveis)
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a lista de agentes',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao buscar agentes:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar agentes',
        variant: 'destructive',
      })
    } finally {
      setIsFetching(false)
    }
  }

  const handleTransfer = async () => {
    if (!selectedAgenteId) {
      toast({
        title: 'Atenção',
        description: 'Selecione um agente para transferir',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/os/${osId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          novoAgenteResponsavelId: selectedAgenteId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: data.message || 'Tour transferido com sucesso',
        })
        onOpenChange(false)
        setSelectedAgenteId('')
        router.refresh()
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao transferir tour',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao transferir tour:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao transferir tour',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const agenteNome = agentes.find((a) => a.id === selectedAgenteId)?.nome

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Transferir Responsável
          </DialogTitle>
          <DialogDescription>
            Transferir a responsabilidade deste tour para outro agente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Responsável Atual</Label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <p className="font-medium">{agenteAtual.nome}</p>
              <p className="text-sm text-gray-600">{agenteAtual.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="novo-agente">Novo Responsável *</Label>
            {isFetching ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Carregando agentes...</span>
              </div>
            ) : agentes.length === 0 ? (
              <div className="p-4 border rounded-md text-center text-sm text-gray-500">
                Nenhum outro agente disponível
              </div>
            ) : (
              <Select value={selectedAgenteId} onValueChange={setSelectedAgenteId}>
                <SelectTrigger id="novo-agente">
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent>
                  {agentes.map((agente) => (
                    <SelectItem key={agente.id} value={agente.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{agente.nome}</span>
                        <span className="text-xs text-gray-500">{agente.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedAgenteId && agenteNome && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Atenção:</strong> O tour será transferido para <strong>{agenteNome}</strong>.
                Esta ação será registrada no histórico.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setSelectedAgenteId('')
            }}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={isLoading || !selectedAgenteId || isFetching}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferindo...
              </>
            ) : (
              'Transferir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
