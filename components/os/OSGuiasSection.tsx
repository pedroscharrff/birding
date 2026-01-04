"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Phone, Compass, Edit2, Trash2, Building2, User } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { GuiaFormDialog, GuiaFormData } from '@/components/forms/GuiaFormDialog'
import { FornecedorGuiamentoFormDialog, FornecedorGuiamentoFormData } from '@/components/forms/FornecedorGuiamentoFormDialog'

interface Guia {
  id: string
  guiaId: string
  funcao?: string | null
  guia: {
    id: string
    nome: string
    email: string
    telefone?: string | null
    roleGlobal: string
  }
}

interface FornecedorGuiamento {
  id: string
  fornecedorId: string
  contatoNome?: string | null
  contatoEmail?: string | null
  contatoTelefone?: string | null
  contratoRef?: string | null
  fornecedor: {
    id: string
    nomeFantasia: string
    razaoSocial?: string | null
    tipo: string
    email?: string | null
    telefone?: string | null
  }
}

interface OSGuiasSectionProps {
  osId: string
  guias: Guia[]
  onUpdate: () => void
}

export function OSGuiasSection({ osId, guias, onUpdate }: OSGuiasSectionProps) {
  const [isGuiaDialogOpen, setIsGuiaDialogOpen] = useState(false)
  const [isFornecedorDialogOpen, setIsFornecedorDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingGuia, setEditingGuia] = useState<Guia | null>(null)
  const [editingFornecedor, setEditingFornecedor] = useState<FornecedorGuiamento | null>(null)
  const { toast } = useToast()

  // Estados locais otimistas
  const [localGuias, setLocalGuias] = useState(guias)
  const [localFornecedores, setLocalFornecedores] = useState<FornecedorGuiamento[]>([])
  const [loadingFornecedores, setLoadingFornecedores] = useState(true)

  // Sincroniza guias quando a prop mudar
  useEffect(() => {
    setLocalGuias(guias)
  }, [guias])

  // Buscar fornecedores de guiamento
  useEffect(() => {
    fetchFornecedoresGuiamento()
  }, [osId])

  const fetchFornecedoresGuiamento = async () => {
    setLoadingFornecedores(true)
    try {
      const res = await fetch(`/api/os/${osId}/fornecedores-guiamento`, {
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao buscar fornecedores')
      }

      setLocalFornecedores(data.data)
    } catch (error: any) {
      console.error('Erro ao buscar fornecedores:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao buscar fornecedores de guiamento',
        variant: 'destructive',
      })
    } finally {
      setLoadingFornecedores(false)
    }
  }

  const handleAddGuia = async (formData: GuiaFormData) => {
    setLoading(true)

    const payload = {
      guiaId: formData.guiaId,
      funcao: formData.funcao?.trim() || null,
    }

    try {
      const res = await fetch(`/api/os/${osId}/guias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao adicionar guia')
      }

      // Adicionar à lista local
      setLocalGuias((prev) => [...prev, data.data])

      toast({
        title: 'Sucesso',
        description: 'Guia adicionado com sucesso',
      })

      setIsGuiaDialogOpen(false)

      // Opcional: atualizar dados externos se necessário
      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar guia',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditGuia = async (formData: GuiaFormData) => {
    if (!editingGuia) return

    setLoading(true)

    const payload = {
      funcao: formData.funcao?.trim() || null,
    }

    try {
      const res = await fetch(`/api/os/${osId}/guias/${editingGuia.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar guia')
      }

      // Atualizar na lista local
      setLocalGuias((prev) =>
        prev.map((g) => (g.id === editingGuia.id ? data.data : g))
      )

      toast({
        title: 'Sucesso',
        description: 'Guia atualizado com sucesso',
      })

      setEditingGuia(null)
      setIsGuiaDialogOpen(false)

      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar guia',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGuia = async (guiaDesignacaoId: string, guiaNome: string) => {
    if (!confirm(`Tem certeza que deseja remover o guia ${guiaNome} desta OS? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const res = await fetch(`/api/os/${osId}/guias/${guiaDesignacaoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao remover guia')
      }

      // Remover da lista local
      setLocalGuias((prev) => prev.filter((g) => g.id !== guiaDesignacaoId))

      toast({
        title: 'Sucesso',
        description: 'Guia removido com sucesso',
      })

      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover guia',
        variant: 'destructive',
      })
    }
  }

  const handleAddFornecedor = async (formData: FornecedorGuiamentoFormData) => {
    setLoading(true)

    const payload = {
      fornecedorId: formData.fornecedorId,
      contatoNome: formData.contatoNome?.trim() || null,
      contatoEmail: formData.contatoEmail?.trim() || null,
      contatoTelefone: formData.contatoTelefone?.trim() || null,
      contratoRef: formData.contratoRef?.trim() || null,
    }

    try {
      const res = await fetch(`/api/os/${osId}/fornecedores-guiamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao adicionar fornecedor')
      }

      setLocalFornecedores((prev) => [...prev, data.data])

      toast({
        title: 'Sucesso',
        description: 'Fornecedor de guiamento adicionado com sucesso',
      })

      setIsFornecedorDialogOpen(false)

      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar fornecedor',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditFornecedor = async (formData: FornecedorGuiamentoFormData) => {
    if (!editingFornecedor) return

    setLoading(true)

    const payload = {
      contatoNome: formData.contatoNome?.trim() || null,
      contatoEmail: formData.contatoEmail?.trim() || null,
      contatoTelefone: formData.contatoTelefone?.trim() || null,
      contratoRef: formData.contratoRef?.trim() || null,
    }

    try {
      const res = await fetch(`/api/os/${osId}/fornecedores-guiamento/${editingFornecedor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar fornecedor')
      }

      setLocalFornecedores((prev) =>
        prev.map((f) => (f.id === editingFornecedor.id ? data.data : f))
      )

      toast({
        title: 'Sucesso',
        description: 'Fornecedor atualizado com sucesso',
      })

      setEditingFornecedor(null)
      setIsFornecedorDialogOpen(false)

      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar fornecedor',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFornecedor = async (fornecedorOsId: string, fornecedorNome: string) => {
    if (!confirm(`Tem certeza que deseja remover o fornecedor ${fornecedorNome} desta OS? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const res = await fetch(`/api/os/${osId}/fornecedores-guiamento/${fornecedorOsId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao remover fornecedor')
      }

      setLocalFornecedores((prev) => prev.filter((f) => f.id !== fornecedorOsId))

      toast({
        title: 'Sucesso',
        description: 'Fornecedor removido com sucesso',
      })

      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover fornecedor',
        variant: 'destructive',
      })
    }
  }

  const handleOpenGuiaDialog = (guia?: Guia) => {
    if (guia) {
      setEditingGuia(guia)
    } else {
      setEditingGuia(null)
    }
    setIsGuiaDialogOpen(true)
  }

  const handleOpenFornecedorDialog = (fornecedor?: FornecedorGuiamento) => {
    if (fornecedor) {
      setEditingFornecedor(fornecedor)
    } else {
      setEditingFornecedor(null)
    }
    setIsFornecedorDialogOpen(true)
  }

  const handleSubmitGuia = async (formData: GuiaFormData) => {
    if (editingGuia) {
      await handleEditGuia(formData)
    } else {
      await handleAddGuia(formData)
    }
  }

  const handleSubmitFornecedor = async (formData: FornecedorGuiamentoFormData) => {
    if (editingFornecedor) {
      await handleEditFornecedor(formData)
    } else {
      await handleAddFornecedor(formData)
    }
  }

  const totalGuias = localGuias.length + localFornecedores.length

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guias</CardTitle>
              <CardDescription>
                {totalGuias} {totalGuias === 1 ? 'guia/fornecedor designado' : 'guias/fornecedores designados'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleOpenGuiaDialog()}>
                <User className="h-4 w-4 mr-2" />
                Adicionar Guia Interno
              </Button>
              <Button onClick={() => handleOpenFornecedorDialog()} variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Adicionar Fornecedor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {localGuias.length === 0 && localFornecedores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Compass className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Nenhum guia ou fornecedor de guiamento designado</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => handleOpenGuiaDialog()}>
                  <User className="h-4 w-4 mr-2" />
                  Adicionar Guia Interno
                </Button>
                <Button variant="outline" onClick={() => handleOpenFornecedorDialog()}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Adicionar Fornecedor
                </Button>
              </div>
            </div>
          ) : (
          <div className="space-y-3">
            {/* Guias Internos */}
            {localGuias.map((guia) => (
              <div
                key={guia.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium">{guia.guia.nome}</h4>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      Guia Interno
                    </span>
                    {guia.funcao && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                        {guia.funcao}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{guia.guia.email}</span>
                    </div>
                    {guia.guia.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{guia.guia.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenGuiaDialog(guia)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGuia(guia.id, guia.guia.nome)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Fornecedores de Guiamento */}
            {loadingFornecedores ? (
              <div className="text-center py-4 text-gray-500">
                Carregando fornecedores...
              </div>
            ) : (
              localFornecedores.map((fornecedor) => (
                <div
                  key={fornecedor.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors bg-amber-50/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      <h4 className="font-medium">{fornecedor.fornecedor.nomeFantasia}</h4>
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                        Fornecedor
                      </span>
                    </div>
                    {fornecedor.fornecedor.razaoSocial && (
                      <p className="text-xs text-gray-500 mb-2">{fornecedor.fornecedor.razaoSocial}</p>
                    )}
                    <div className="space-y-1 text-sm text-gray-600">
                      {fornecedor.contatoNome && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>{fornecedor.contatoNome}</span>
                        </div>
                      )}
                      {(fornecedor.contatoEmail || fornecedor.fornecedor.email) && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{fornecedor.contatoEmail || fornecedor.fornecedor.email}</span>
                        </div>
                      )}
                      {(fornecedor.contatoTelefone || fornecedor.fornecedor.telefone) && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{fornecedor.contatoTelefone || fornecedor.fornecedor.telefone}</span>
                        </div>
                      )}
                      {fornecedor.contratoRef && (
                        <div className="text-xs text-gray-500 mt-1">
                          Contrato: {fornecedor.contratoRef}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenFornecedorDialog(fornecedor)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFornecedor(fornecedor.id, fornecedor.fornecedor.nomeFantasia)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>

    <GuiaFormDialog
      open={isGuiaDialogOpen}
      onOpenChange={(open) => {
        setIsGuiaDialogOpen(open)
        if (!open) setEditingGuia(null)
      }}
      onSubmit={handleSubmitGuia}
      loading={loading}
      mode={editingGuia ? 'edit' : 'create'}
      initialData={
        editingGuia
          ? {
              guiaId: editingGuia.guiaId,
              funcao: editingGuia.funcao || '',
            }
          : undefined
      }
      osId={osId}
      guiasJaDesignados={localGuias.map((g) => g.guiaId)}
    />

    <FornecedorGuiamentoFormDialog
      open={isFornecedorDialogOpen}
      onOpenChange={(open) => {
        setIsFornecedorDialogOpen(open)
        if (!open) setEditingFornecedor(null)
      }}
      onSubmit={handleSubmitFornecedor}
      loading={loading}
      mode={editingFornecedor ? 'edit' : 'create'}
      initialData={
        editingFornecedor
          ? {
              fornecedorId: editingFornecedor.fornecedorId,
              contatoNome: editingFornecedor.contatoNome || '',
              contatoEmail: editingFornecedor.contatoEmail || '',
              contatoTelefone: editingFornecedor.contatoTelefone || '',
              contratoRef: editingFornecedor.contratoRef || '',
            }
          : undefined
      }
      osId={osId}
      fornecedoresJaVinculados={localFornecedores.map((f) => f.fornecedorId)}
    />
  </>
  )
}
