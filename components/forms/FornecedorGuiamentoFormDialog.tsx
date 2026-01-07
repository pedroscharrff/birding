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
import { useApi } from '@/hooks/useApi'
import { Loader2, Building2 } from 'lucide-react'

export interface FornecedorGuiamentoFormData {
  fornecedorId: string
  contatoNome?: string
  contatoEmail?: string
  contatoTelefone?: string
  contratoRef?: string
}

interface FornecedorGuiamentoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FornecedorGuiamentoFormData) => void
  loading: boolean
  mode: 'create' | 'edit'
  initialData?: FornecedorGuiamentoFormData
  osId: string
  fornecedoresJaVinculados: string[]
}

interface FornecedorDisponivel {
  id: string
  nomeFantasia: string
  razaoSocial?: string
  email?: string
  telefone?: string
  tipo: string
}

export function FornecedorGuiamentoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  mode,
  initialData,
  osId,
  fornecedoresJaVinculados,
}: FornecedorGuiamentoFormDialogProps) {
  const [formData, setFormData] = useState<FornecedorGuiamentoFormData>(
    initialData || {
      fornecedorId: '',
      contatoNome: '',
      contatoEmail: '',
      contatoTelefone: '',
      contratoRef: '',
    }
  )

  // Buscar fornecedores de guiamento disponíveis
  const { data: fornecedoresDisponiveis, loading: loadingFornecedores } = useApi<FornecedorDisponivel[]>(
    '/api/fornecedores?tipo=guiamento',
    { autoFetch: true }
  )

  // Resetar formulário quando abrir/fechar ou mudar de modo
  useEffect(() => {
    if (open) {
      setFormData(
        initialData || {
          fornecedorId: '',
          contatoNome: '',
          contatoEmail: '',
          contatoTelefone: '',
          contratoRef: '',
        }
      )
    }
  }, [open, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fornecedorId && mode === 'create') {
      alert('Por favor, selecione um fornecedor')
      return
    }

    onSubmit(formData)
  }

  // Filtrar fornecedores disponíveis (excluir os já vinculados, exceto se estiver editando)
  const fornecedoresFiltrados = fornecedoresDisponiveis?.filter(
    (fornecedor) => !fornecedoresJaVinculados.includes(fornecedor.id) || fornecedor.id === initialData?.fornecedorId
  ) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar Fornecedor de Guiamento' : 'Editar Informações de Contato'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Selecione um fornecedor de guiamento para vincular a esta operação'
              : 'Atualize as informações de contato do fornecedor'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="fornecedorId">
                Fornecedor <span className="text-red-500">*</span>
              </Label>
              {loadingFornecedores ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando fornecedores...
                </div>
              ) : fornecedoresFiltrados.length === 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-amber-600 p-3 border border-amber-200 rounded-md bg-amber-50">
                    <p className="font-medium mb-1">⚠️ Nenhum fornecedor disponível</p>
                    {fornecedoresDisponiveis && fornecedoresDisponiveis.length > 0 ? (
                      <p>Todos os fornecedores de guiamento já foram vinculados a esta OS.</p>
                    ) : (
                      <p>Não há fornecedores de guiamento cadastrados no sistema.</p>
                    )}
                  </div>
                  {(!fornecedoresDisponiveis || fornecedoresDisponiveis.length === 0) && (
                    <div className="text-sm p-3 border rounded-md bg-blue-50 border-blue-200">
                      <p className="font-medium text-blue-800 mb-2">💡 Como criar fornecedores de guiamento:</p>
                      <ol className="text-blue-700 space-y-1 text-xs list-decimal list-inside">
                        <li>Acesse a página de Fornecedores</li>
                        <li>Cadastre um novo fornecedor com tipo "Guiamento"</li>
                      </ol>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => window.open('/dashboard/fornecedores', '_blank')}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Ir para Fornecedores
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <select
                  id="fornecedorId"
                  value={formData.fornecedorId}
                  onChange={(e) =>
                    setFormData({ ...formData, fornecedorId: e.target.value })
                  }
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Selecione um fornecedor</option>
                  {fornecedoresFiltrados.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nomeFantasia}
                      {fornecedor.razaoSocial && ` (${fornecedor.razaoSocial})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="contatoNome">Nome do Contato</Label>
            <Input
              id="contatoNome"
              placeholder="Ex: João Silva"
              value={formData.contatoNome}
              onChange={(e) =>
                setFormData({ ...formData, contatoNome: e.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contatoEmail">Email do Contato</Label>
            <Input
              id="contatoEmail"
              type="email"
              placeholder="contato@exemplo.com"
              value={formData.contatoEmail}
              onChange={(e) =>
                setFormData({ ...formData, contatoEmail: e.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contatoTelefone">Telefone do Contato</Label>
            <Input
              id="contatoTelefone"
              placeholder="(11) 98765-4321"
              value={formData.contatoTelefone}
              onChange={(e) =>
                setFormData({ ...formData, contatoTelefone: e.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contratoRef">Referência do Contrato</Label>
            <Input
              id="contratoRef"
              placeholder="Ex: CONT-2024-001"
              value={formData.contratoRef}
              onChange={(e) =>
                setFormData({ ...formData, contratoRef: e.target.value })
              }
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Opcional: Número ou referência do contrato com este fornecedor
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
              disabled={loading || (mode === 'create' && (!formData.fornecedorId || fornecedoresFiltrados.length === 0))}
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
