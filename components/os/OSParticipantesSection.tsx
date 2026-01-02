"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Phone, User, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'
import { ParticipanteFormDialog, ParticipanteFormData } from '@/components/forms/ParticipanteFormDialog'

interface Participante {
  id: string
  nome: string
  email: string
  telefone?: string
  passaporteNumero?: string
  passaporteValidade?: string
  alergias?: string
  restricoes?: string
  preferencias?: string
  idade?: number
  observacoes?: string
}

interface OSParticipantesSectionProps {
  osId: string
  participantes: Participante[]
  onUpdate: () => void
}

export function OSParticipantesSection({ osId, participantes, onUpdate }: OSParticipantesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null)
  const { toast } = useToast()

  // Estado local otimista
  const [localParticipantes, setLocalParticipantes] = useState(participantes)

  // Sincroniza quando a prop mudar
  useEffect(() => {
    setLocalParticipantes(participantes)
  }, [participantes])

  const handleAddParticipante = async (formData: ParticipanteFormData) => {
    setLoading(true)

    // Normaliza strings vazias para undefined e converte idade
    const normalized = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => {
        if (typeof value === 'string') {
          const t = value.trim()
          return [key, t === '' ? undefined : t]
        }
        return [key, value]
      })
    ) as ParticipanteFormData

    const payload = {
      ...normalized,
      idade: normalized.idade ? parseInt(normalized.idade) : undefined,
    }

    // Cria um participante otimista temporário
    const tempId = `temp-${Date.now()}`
    const optimisticParticipante = {
      id: tempId,
      ...payload,
      createdAt: new Date().toISOString(),
    } as any

    // 1. ATUALIZAÇÃO OTIMISTA - adiciona imediatamente na UI
    setLocalParticipantes((prev) => [...prev, optimisticParticipante])

    try {
      // 2. SINCRONIZAR COM SERVIDOR
      const res = await fetch(`/api/os/${osId}/participantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao adicionar participante')
      }

      // 3. SUBSTITUI o temporário pelo real
      setLocalParticipantes((prev) =>
        prev.map((p) => (p.id === tempId ? data.data : p))
      )

      toast({
        title: 'Sucesso',
        description: 'Participante adicionado com sucesso',
      })

      setIsDialogOpen(false)

      // Opcional: atualizar dados externos se necessário
      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      // 4. ROLLBACK - remove o participante temporário
      setLocalParticipantes((prev) => prev.filter((p) => p.id !== tempId))

      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar participante',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditParticipante = async (formData: ParticipanteFormData) => {
    if (!editingParticipante) return

    setLoading(true)

    // Normaliza strings vazias para undefined e converte idade
    const normalized = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => {
        if (typeof value === 'string') {
          const t = value.trim()
          return [key, t === '' ? undefined : t]
        }
        return [key, value]
      })
    ) as ParticipanteFormData

    const payload = {
      ...normalized,
      idade: normalized.idade ? parseInt(normalized.idade) : undefined,
    }

    try {
      const res = await fetch(`/api/os/${osId}/participantes/${editingParticipante.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar participante')
      }

      // Atualizar na lista local
      setLocalParticipantes((prev) =>
        prev.map((p) => (p.id === editingParticipante.id ? data.data : p))
      )

      toast({
        title: 'Sucesso',
        description: 'Participante atualizado com sucesso',
      })

      setEditingParticipante(null)
      setIsDialogOpen(false)

      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar participante',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteParticipante = async (participanteId: string) => {
    if (!confirm('Tem certeza que deseja excluir este participante? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const res = await fetch(`/api/os/${osId}/participantes/${participanteId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao deletar participante')
      }

      // Remover da lista local
      setLocalParticipantes((prev) => prev.filter((p) => p.id !== participanteId))

      toast({
        title: 'Sucesso',
        description: 'Participante deletado com sucesso',
      })

      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar participante',
        variant: 'destructive',
      })
    }
  }

  const handleOpenDialog = (participante?: Participante) => {
    if (participante) {
      setEditingParticipante(participante)
    } else {
      setEditingParticipante(null)
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (formData: ParticipanteFormData) => {
    if (editingParticipante) {
      await handleEditParticipante(formData)
    } else {
      await handleAddParticipante(formData)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Participantes</CardTitle>
              <CardDescription>
                {localParticipantes.length} {localParticipantes.length === 1 ? 'participante' : 'participantes'} cadastrados
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Participante
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {localParticipantes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum participante cadastrado</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                Adicionar Primeiro Participante
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {localParticipantes.map((participante) => (
                <div
                  key={participante.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{participante.nome}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{participante.email}</span>
                        </div>
                        {participante.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{participante.telefone}</span>
                          </div>
                        )}
                        {participante.passaporteNumero && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Passaporte:</span>
                            <span>{participante.passaporteNumero}</span>
                            {participante.passaporteValidade && (
                              <span className="text-xs">
                                (válido até {format(new Date(participante.passaporteValidade), 'dd/MM/yyyy')})
                              </span>
                            )}
                          </div>
                        )}
                        {participante.idade && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Idade:</span>
                            <span>{participante.idade} anos</span>
                          </div>
                        )}
                      </div>
                      {(participante.alergias || participante.restricoes || participante.preferencias) && (
                        <div className="mt-3 pt-3 border-t space-y-3 text-sm">
                          {participante.alergias && (
                            <div>
                              <div className="font-medium text-red-600 mb-1">Alergias</div>
                              <div className="flex flex-wrap gap-2">
                                {participante.alergias.split(',').map((v) => (
                                  <span key={`al-${participante.id}-${v.trim()}`} className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                                    {v.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {participante.restricoes && (
                            <div>
                              <div className="font-medium text-orange-600 mb-1">Restrições</div>
                              <div className="flex flex-wrap gap-2">
                                {participante.restricoes.split(',').map((v) => (
                                  <span key={`re-${participante.id}-${v.trim()}`} className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800">
                                    {v.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {participante.preferencias && (
                            <div>
                              <div className="font-medium text-blue-600 mb-1">Preferências</div>
                              <div className="flex flex-wrap gap-2">
                                {participante.preferencias.split(',').map((v) => (
                                  <span key={`pr-${participante.id}-${v.trim()}`} className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                                    {v.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(participante)}
                        title="Editar participante"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteParticipante(participante.id)}
                        title="Excluir participante"
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

      <ParticipanteFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingParticipante(null)
        }}
        onSubmit={handleSubmit}
        loading={loading}
        mode={editingParticipante ? 'edit' : 'create'}
        initialData={editingParticipante ? {
          nome: editingParticipante.nome,
          email: editingParticipante.email,
          telefone: editingParticipante.telefone || '',
          passaporteNumero: editingParticipante.passaporteNumero || '',
          passaporteValidade: editingParticipante.passaporteValidade || '',
          alergias: editingParticipante.alergias || '',
          restricoes: editingParticipante.restricoes || '',
          preferencias: editingParticipante.preferencias || '',
          idade: editingParticipante.idade?.toString() || '',
          observacoes: editingParticipante.observacoes || '',
        } : undefined}
      />
    </>
  )
}
