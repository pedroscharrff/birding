"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, CheckCircle, Copy, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

type Policy = {
  id: string
  orgId: string
  nome: string
  descricao: string | null
  versao: number
  ativa: boolean
  financeiro: {
    margemMinimaPercentual: number
    entradaMinimaPercentual: number
    toleranciaCustoRealAcimaEstimadoPercentual: number
  }
  prazos: {
    prazoMinimoGuiaDias: number
    prazoMinimoMotoristaDias: number
    prazoMinimoHospedagemDias: number
  }
  createdAt: string
  updatedAt: string
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { toast } = useToast()

  // TODO: Obter orgId do usuário autenticado
  const orgId = 'default-org-id'

  useEffect(() => {
    loadPolicies()
  }, [])

  async function loadPolicies() {
    try {
      setLoading(true)
      const response = await fetch(`/api/policies?orgId=${orgId}`)
      if (!response.ok) throw new Error('Erro ao carregar políticas')
      const data = await response.json()
      setPolicies(data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as políticas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function activatePolicy(policyId: string) {
    try {
      const response = await fetch(`/api/policies/${policyId}/activate`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Erro ao ativar política')
      
      toast({
        title: 'Sucesso',
        description: 'Política ativada com sucesso',
      })
      
      await loadPolicies()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar a política',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando políticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Políticas de Negócio</h1>
          <p className="text-muted-foreground mt-2">
            Configure as regras de validação e alertas da sua organização
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Política
        </Button>
      </div>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Nenhuma política configurada ainda.
              </p>
              <p className="text-sm text-muted-foreground">
                A política padrão do sistema está sendo usada.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Política
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onActivate={() => activatePolicy(policy.id)}
              onEdit={() => setEditingPolicy(policy)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <PolicyEditorModal
          orgId={orgId}
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false)
            loadPolicies()
          }}
        />
      )}

      {editingPolicy && (
        <PolicyEditorModal
          orgId={orgId}
          policy={editingPolicy}
          onClose={() => setEditingPolicy(null)}
          onSave={() => {
            setEditingPolicy(null)
            loadPolicies()
          }}
        />
      )}
    </div>
  )
}

function PolicyCard({
  policy,
  onActivate,
  onEdit,
}: {
  policy: Policy
  onActivate: () => void
  onEdit: () => void
}) {
  return (
    <Card className={policy.ativa ? 'border-green-500 border-2' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle>{policy.nome}</CardTitle>
              <Badge variant="outline">v{policy.versao}</Badge>
              {policy.ativa && (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  ATIVA
                </Badge>
              )}
            </div>
            {policy.descricao && (
              <CardDescription>{policy.descricao}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {!policy.ativa && (
              <Button variant="outline" size="sm" onClick={onActivate}>
                Ativar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-sm mb-3">💰 Financeiro</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Margem Mínima:</dt>
                <dd className="font-medium">{policy.financeiro.margemMinimaPercentual}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Entrada Mínima:</dt>
                <dd className="font-medium">{policy.financeiro.entradaMinimaPercentual}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tolerância Custo:</dt>
                <dd className="font-medium">{policy.financeiro.toleranciaCustoRealAcimaEstimadoPercentual}%</dd>
              </div>
            </dl>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">⏱️ Prazos</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Prazo Guia:</dt>
                <dd className="font-medium">{policy.prazos.prazoMinimoGuiaDias} dias</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Prazo Motorista:</dt>
                <dd className="font-medium">{policy.prazos.prazoMinimoMotoristaDias} dias</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Prazo Hospedagem:</dt>
                <dd className="font-medium">{policy.prazos.prazoMinimoHospedagemDias} dias</dd>
              </div>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PolicyEditorModal({
  orgId,
  policy,
  onClose,
  onSave,
}: {
  orgId: string
  policy?: Policy
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    nome: policy?.nome || '',
    descricao: policy?.descricao || '',
    financeiro: {
      margemMinimaPercentual: policy?.financeiro.margemMinimaPercentual || 15,
      entradaMinimaPercentual: policy?.financeiro.entradaMinimaPercentual || 30,
      toleranciaCustoRealAcimaEstimadoPercentual: policy?.financeiro.toleranciaCustoRealAcimaEstimadoPercentual || 20,
    },
    prazos: {
      prazoMinimoGuiaDias: policy?.prazos.prazoMinimoGuiaDias || 15,
      prazoMinimoMotoristaDias: policy?.prazos.prazoMinimoMotoristaDias || 10,
      prazoMinimoHospedagemDias: policy?.prazos.prazoMinimoHospedagemDias || 7,
    },
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    try {
      setSaving(true)
      
      const url = policy ? `/api/policies/${policy.id}` : '/api/policies'
      const method = policy ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          ...formData,
        }),
      })

      if (!response.ok) throw new Error('Erro ao salvar política')

      toast({
        title: 'Sucesso',
        description: policy ? 'Política atualizada' : 'Política criada',
      })

      onSave()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a política',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{policy ? 'Editar Política' : 'Nova Política'}</CardTitle>
          <CardDescription>
            Configure as regras de validação e alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Política Conservadora"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o propósito desta política"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">💰 Configurações Financeiras</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Margem Mínima (%)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={formData.financeiro.margemMinimaPercentual}
                  onChange={(e) => setFormData({
                    ...formData,
                    financeiro: {
                      ...formData.financeiro,
                      margemMinimaPercentual: Number(e.target.value),
                    },
                  })}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Entrada Mínima (%)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={formData.financeiro.entradaMinimaPercentual}
                  onChange={(e) => setFormData({
                    ...formData,
                    financeiro: {
                      ...formData.financeiro,
                      entradaMinimaPercentual: Number(e.target.value),
                    },
                  })}
                  min="0"
                  max="100"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Tolerância Custo Real (%)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={formData.financeiro.toleranciaCustoRealAcimaEstimadoPercentual}
                  onChange={(e) => setFormData({
                    ...formData,
                    financeiro: {
                      ...formData.financeiro,
                      toleranciaCustoRealAcimaEstimadoPercentual: Number(e.target.value),
                    },
                  })}
                  min="0"
                  max="100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quanto o custo real pode exceder o estimado antes de gerar alerta
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">⏱️ Prazos Operacionais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Prazo Guia (dias)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={formData.prazos.prazoMinimoGuiaDias}
                  onChange={(e) => setFormData({
                    ...formData,
                    prazos: {
                      ...formData.prazos,
                      prazoMinimoGuiaDias: Number(e.target.value),
                    },
                  })}
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prazo Motorista (dias)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={formData.prazos.prazoMinimoMotoristaDias}
                  onChange={(e) => setFormData({
                    ...formData,
                    prazos: {
                      ...formData.prazos,
                      prazoMinimoMotoristaDias: Number(e.target.value),
                    },
                  })}
                  min="0"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Prazo Hospedagem (dias)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={formData.prazos.prazoMinimoHospedagemDias}
                  onChange={(e) => setFormData({
                    ...formData,
                    prazos: {
                      ...formData.prazos,
                      prazoMinimoHospedagemDias: Number(e.target.value),
                    },
                  })}
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : policy ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
