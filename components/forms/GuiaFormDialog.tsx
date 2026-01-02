"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/hooks/useApi'
import { Loader2 } from 'lucide-react'

export interface GuiaFormData {
  guiaId: string
  funcao?: string
}

interface GuiaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: GuiaFormData) => void
  loading: boolean
  mode: 'create' | 'edit'
  initialData?: GuiaFormData
  osId: string
  guiasJaDesignados: string[]
}

interface GuiaDisponivel {
  id: string
  nome: string
  email: string
  telefone?: string
}

export function GuiaFormDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  mode,
  initialData,
  osId,
  guiasJaDesignados,
}: GuiaFormDialogProps) {
  const [formData, setFormData] = useState<GuiaFormData>(
    initialData || {
      guiaId: '',
      funcao: '',
    }
  )

  // Buscar guias disponíveis
  const { data: guiasDisponiveis, loading: loadingGuias } = useApi<GuiaDisponivel[]>(
    '/api/usuarios/guias',
    { autoFetch: true }
  )

  // Resetar formulário quando abrir/fechar ou mudar de modo
  useEffect(() => {
    if (open) {
      setFormData(
        initialData || {
          guiaId: '',
          funcao: '',
        }
      )
    }
  }, [open, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.guiaId && mode === 'create') {
      alert('Por favor, selecione um guia')
      return
    }

    onSubmit(formData)
  }

  // Filtrar guias disponíveis (excluir os já designados, exceto se estiver editando)
  const guiasFiltrados = guiasDisponiveis?.filter(
    (guia) => !guiasJaDesignados.includes(guia.id) || guia.id === initialData?.guiaId
  ) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar Guia' : 'Editar Designação'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Selecione um guia para designar a esta operação'
              : 'Atualize a função do guia designado'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="guiaId">
                Guia <span className="text-red-500">*</span>
              </Label>
              {loadingGuias ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando guias...
                </div>
              ) : guiasFiltrados.length === 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-amber-600 p-3 border border-amber-200 rounded-md bg-amber-50">
                    <p className="font-medium mb-1">⚠️ Nenhum guia disponível</p>
                    {guiasDisponiveis && guiasDisponiveis.length > 0 ? (
                      <p>Todos os guias já foram designados para esta OS.</p>
                    ) : (
                      <p>Não há guias cadastrados no sistema.</p>
                    )}
                  </div>
                  {(!guiasDisponiveis || guiasDisponiveis.length === 0) && (
                    <div className="text-sm p-3 border rounded-md bg-blue-50 border-blue-200">
                      <p className="font-medium text-blue-800 mb-2">💡 Como criar guias:</p>
                      <ol className="text-blue-700 space-y-1 text-xs list-decimal list-inside">
                        <li>Execute o comando: <code className="bg-blue-100 px-1 rounded">npx tsx scripts/seed-guias.ts</code></li>
                        <li>Ou cadastre usuários manualmente com roleGlobal = 'guia'</li>
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <Select
                  value={formData.guiaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, guiaId: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um guia" />
                  </SelectTrigger>
                  <SelectContent>
                    {guiasFiltrados.map((guia) => (
                      <SelectItem key={guia.id} value={guia.id}>
                        <div>
                          <div className="font-medium">{guia.nome}</div>
                          <div className="text-xs text-gray-500">{guia.email}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="funcao">Função</Label>
            <Input
              id="funcao"
              placeholder="Ex: Guia principal, Guia assistente, etc."
              value={formData.funcao}
              onChange={(e) =>
                setFormData({ ...formData, funcao: e.target.value })
              }
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Opcional: Especifique a função deste guia na operação
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (mode === 'create' && (!formData.guiaId || guiasFiltrados.length === 0))}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Adicionar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
