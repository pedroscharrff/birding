"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Utensils, MapPin, Calendar, Clock, DollarSign, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FornecedorSelect } from '@/components/forms/FornecedorSelect'
import { TarifaSelect } from '@/components/forms/TarifaSelect'

interface Alimentacao {
  id: string
  nome: string
  valor?: number
  moeda: string
  localizacao?: string
  data?: string
  hora?: string
  notas?: string
  fornecedor?: {
    id: string
    nomeFantasia: string
  }
}

interface OSAlimentacaoSectionProps {
  osId: string
  alimentacoes: Alimentacao[]
  onUpdate: () => void
}

export function OSAlimentacaoSection({ osId, alimentacoes, onUpdate }: OSAlimentacaoSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingAlimentacao, setEditingAlimentacao] = useState<Alimentacao | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: '',
    fornecedorId: '',
    valor: '',
    moeda: 'BRL',
    localizacao: '',
    data: '',
    hora: '',
    notas: '',
    tarifaId: '',
  })

  const resetForm = () => {
    setFormData({
      nome: '',
      fornecedorId: '',
      valor: '',
      moeda: 'BRL',
      localizacao: '',
      data: '',
      hora: '',
      notas: '',
      tarifaId: '',
    })
  }

  const handleAddAlimentacao = async () => {
    if (!formData.nome) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe o nome da refeição',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      // Usar a API de atividades com tipo alimentação
      const payload = {
        tipo: 'alimentacao',
        nome: formData.nome,
        fornecedorId: formData.fornecedorId || undefined,
        valor: formData.valor ? parseFloat(formData.valor) : undefined,
        moeda: formData.moeda,
        localizacao: formData.localizacao || undefined,
        data: formData.data || undefined,
        hora: formData.hora || undefined,
        notas: formData.notas || undefined,
      }

      const url = editingAlimentacao
        ? `/api/os/${osId}/atividades/${editingAlimentacao.id}`
        : `/api/os/${osId}/atividades`
      const method = editingAlimentacao ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Erro ao ${editingAlimentacao ? 'atualizar' : 'adicionar'} alimentação`)
      }

      toast({
        title: 'Sucesso',
        description: `Alimentação ${editingAlimentacao ? 'atualizada' : 'adicionada'} com sucesso`,
      })

      resetForm()
      setIsDialogOpen(false)
      setEditingAlimentacao(null)
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Erro ao ${editingAlimentacao ? 'atualizar' : 'adicionar'} alimentação`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditAlimentacao = (alimentacao: Alimentacao) => {
    setEditingAlimentacao(alimentacao)
    setFormData({
      nome: alimentacao.nome,
      fornecedorId: alimentacao.fornecedor?.id || '',
      valor: alimentacao.valor?.toString() || '',
      moeda: alimentacao.moeda,
      localizacao: alimentacao.localizacao || '',
      data: alimentacao.data ? alimentacao.data.split('T')[0] : '',
      hora: alimentacao.hora || '',
      notas: alimentacao.notas || '',
      tarifaId: '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteAlimentacao = async (alimentacaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta alimentação? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const res = await fetch(`/api/os/${osId}/atividades/${alimentacaoId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao deletar alimentação')
      }

      toast({
        title: 'Sucesso',
        description: 'Alimentação deletada com sucesso',
      })

      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar alimentação',
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (value: number, moeda: string) => {
    const currencySymbols: Record<string, string> = {
      BRL: 'R$',
      USD: '$',
      EUR: '€',
    }
    return `${currencySymbols[moeda] || moeda} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alimentação</CardTitle>
              <CardDescription>
                {alimentacoes.length} {alimentacoes.length === 1 ? 'refeição' : 'refeições'} programadas
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Refeição
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alimentacoes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma refeição programada</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Adicionar Primeira Refeição
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {alimentacoes.map((alimentacao) => {
                try {
                  return (
                    <div
                      key={alimentacao.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{alimentacao.nome}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {alimentacao.localizacao && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{alimentacao.localizacao}</span>
                          </div>
                        )}
                        {alimentacao.data && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(alimentacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                            {alimentacao.hora && (
                              <span className="flex items-center gap-1 ml-2">
                                <Clock className="h-4 w-4" />
                                {alimentacao.hora}
                              </span>
                            )}
                          </div>
                        )}
                        {alimentacao.valor && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">{formatCurrency(alimentacao.valor, alimentacao.moeda)}</span>
                          </div>
                        )}
                        {alimentacao.fornecedor && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Fornecedor:</span>
                            <span>{alimentacao.fornecedor.nomeFantasia}</span>
                          </div>
                        )}
                      </div>
                      {alimentacao.notas && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-700">{alimentacao.notas}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditAlimentacao(alimentacao)}
                        title="Editar alimentação"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAlimentacao(alimentacao.id)}
                        title="Excluir alimentação"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                  )
                } catch (error) {
                  console.error('❌ Erro ao renderizar alimentação:', alimentacao, error)
                  return (
                    <div key={alimentacao.id} className="border rounded-lg p-4 bg-red-50">
                      <p className="text-red-600">Erro ao renderizar: {alimentacao.nome}</p>
                    </div>
                  )
                }
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar alimentação */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{editingAlimentacao ? 'Editar Refeição' : 'Adicionar Refeição'}</h2>
              <p className="text-sm text-gray-600 mt-1">{editingAlimentacao ? 'Atualize os dados da refeição' : 'Preencha os dados da refeição'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Refeição *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Almoço no Restaurante Panorâmico"
                />
              </div>
              <FornecedorSelect
                tipo="alimentacao"
                value={formData.fornecedorId}
                onChange={(fornecedorId) => setFormData({ ...formData, fornecedorId, tarifaId: '' })}
                label="Fornecedor (Restaurante)"
                placeholder="Selecione o restaurante (opcional)..."
              />
              {formData.fornecedorId && (
                <TarifaSelect
                  fornecedorId={formData.fornecedorId}
                  value={formData.tarifaId}
                  onChange={(tarifaId) => setFormData({ ...formData, tarifaId })}
                  label="Tarifa do Fornecedor"
                  onValorChange={(valor, moeda) => {
                    setFormData({ ...formData, valor: valor.toString(), moeda })
                  }}
                />
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    value={formData.localizacao}
                    onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                    placeholder="Local da refeição"
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor por Pessoa</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hora">Horário</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="moeda">Moeda</Label>
                  <select
                    id="moeda"
                    value={formData.moeda}
                    onChange={(e) => setFormData({ ...formData, moeda: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="notas">Notas e Observações</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Informações adicionais sobre a refeição..."
                  rows={4}
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2 sticky bottom-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                  setEditingAlimentacao(null)
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddAlimentacao} disabled={loading}>
                {loading
                  ? `${editingAlimentacao ? 'Atualizando' : 'Adicionando'}...`
                  : editingAlimentacao
                  ? 'Atualizar Refeição'
                  : 'Adicionar Refeição'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
