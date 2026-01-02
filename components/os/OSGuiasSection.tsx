"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Phone, Compass, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { GuiaFormDialog, GuiaFormData } from '@/components/forms/GuiaFormDialog'

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

interface OSGuiasSectionProps {
  osId: string
  guias: Guia[]
  onUpdate: () => void
}

export function OSGuiasSection({ osId, guias, onUpdate }: OSGuiasSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingGuia, setEditingGuia] = useState<Guia | null>(null)
  const { toast } = useToast()

  // Estado local otimista
  const [localGuias, setLocalGuias] = useState(guias)

  // Sincroniza quando a prop mudar
  useEffect(() => {
    setLocalGuias(guias)
  }, [guias])

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

      setIsDialogOpen(false)

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
      setIsDialogOpen(false)

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

  const handleOpenDialog = (guia?: Guia) => {
    if (guia) {
      setEditingGuia(guia)
    } else {
      setEditingGuia(null)
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (formData: GuiaFormData) => {
    if (editingGuia) {
      await handleEditGuia(formData)
    } else {
      await handleAddGuia(formData)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guias</CardTitle>
              <CardDescription>
                {localGuias.length} {localGuias.length === 1 ? 'guia designado' : 'guias designados'}
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Guia
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {localGuias.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Compass className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum guia designado</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                Designar Primeiro Guia
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {localGuias.map((designacao) => (
                <div
                  key={designacao.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Compass className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-lg">{designacao.guia.nome}</h4>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{designacao.guia.email}</span>
                        </div>
                        {designacao.guia.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{designacao.guia.telefone}</span>
                          </div>
                        )}
                        {designacao.funcao && (
                          <div className="mt-2">
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                              {designacao.funcao}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(designacao)}
                        title="Editar função do guia"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteGuia(designacao.id, designacao.guia.nome)}
                        title="Remover guia"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <GuiaFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingGuia(null)
        }}
        onSubmit={handleSubmit}
        loading={loading}
        mode={editingGuia ? 'edit' : 'create'}
        initialData={editingGuia ? {
          guiaId: editingGuia.guiaId,
          funcao: editingGuia.funcao || '',
        } : undefined}
        osId={osId}
        guiasJaDesignados={localGuias.map(g => g.guiaId)}
      />
    </>
  )
}
