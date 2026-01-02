"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, MapPin, Calendar, Clock, DollarSign, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FornecedorSelect } from '@/components/forms/FornecedorSelect'
import { TarifaSelect } from '@/components/forms/TarifaSelect'

interface Atividade {
  id: string
  nome: string
  valor?: number
  moeda: string
  localizacao?: string
  quantidadeMaxima?: number
  data?: string
  hora?: string
  notas?: string
  fornecedor?: {
    id: string
    nomeFantasia: string
  }
}

interface OSAtividadesSectionProps {
  osId: string
  atividades: Atividade[]
  onUpdate: () => void
}

export function OSAtividadesSection({ osId, atividades, onUpdate }: OSAtividadesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingAtividade, setEditingAtividade] = useState<Atividade | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    moeda: 'BRL',
    localizacao: '',
    quantidadeMaxima: '',
    data: '',
    hora: '',
    notas: '',
    fornecedorId: '',
    tarifaId: '',
  })

  const resetForm = () => {
    setFormData({
      nome: '',
      valor: '',
      moeda: 'BRL',
      localizacao: '',
      quantidadeMaxima: '',
      data: '',
      hora: '',
      notas: '',
      fornecedorId: '',
      tarifaId: '',
    })
  }

  const handleAddAtividade = async () => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        valor: formData.valor ? parseFloat(formData.valor) : undefined,
        quantidadeMaxima: formData.quantidadeMaxima ? parseInt(formData.quantidadeMaxima) : undefined,
      }

      const url = editingAtividade
        ? `/api/os/${osId}/atividades/${editingAtividade.id}`
        : `/api/os/${osId}/atividades`
      const method = editingAtividade ? 'PATCH' : 'POST'

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
        throw new Error(data.error || `Erro ao ${editingAtividade ? 'atualizar' : 'adicionar'} atividade`)
      }

      toast({
        title: 'Sucesso',
        description: `Atividade ${editingAtividade ? 'atualizada' : 'adicionada'} com sucesso`,
      })

      resetForm()
      setIsDialogOpen(false)
      setEditingAtividade(null)
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Erro ao ${editingAtividade ? 'atualizar' : 'adicionar'} atividade`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditAtividade = (atividade: Atividade) => {
    setEditingAtividade(atividade)
    setFormData({
      nome: atividade.nome,
      valor: atividade.valor?.toString() || '',
      moeda: atividade.moeda,
      localizacao: atividade.localizacao || '',
      quantidadeMaxima: atividade.quantidadeMaxima?.toString() || '',
      data: atividade.data ? atividade.data.split('T')[0] : '',
      hora: atividade.hora || '',
      notas: atividade.notas || '',
      fornecedorId: atividade.fornecedor?.id || '',
      tarifaId: '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteAtividade = async (atividadeId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const res = await fetch(`/api/os/${osId}/atividades/${atividadeId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao deletar atividade')
      }

      toast({
        title: 'Sucesso',
        description: 'Atividade deletada com sucesso',
      })

      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar atividade',
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
              <CardTitle>Atividades</CardTitle>
              <CardDescription>
                {atividades.length} {atividades.length === 1 ? 'atividade' : 'atividades'} programadas
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Atividade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {atividades.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade programada</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Adicionar Primeira Atividade
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {atividades.map((atividade) => (
                <div
                  key={atividade.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{atividade.nome}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {atividade.localizacao && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{atividade.localizacao}</span>
                          </div>
                        )}
                        {atividade.data && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(atividade.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                            {atividade.hora && (
                              <span className="flex items-center gap-1 ml-2">
                                <Clock className="h-4 w-4" />
                                {atividade.hora}
                              </span>
                            )}
                          </div>
                        )}
                        {atividade.valor && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">{formatCurrency(atividade.valor, atividade.moeda)}</span>
                          </div>
                        )}
                        {atividade.quantidadeMaxima && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Capacidade máxima:</span>
                            <span>{atividade.quantidadeMaxima} pessoas</span>
                          </div>
                        )}
                        {atividade.fornecedor && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Fornecedor:</span>
                            <span>{atividade.fornecedor.nomeFantasia}</span>
                          </div>
                        )}
                      </div>
                      {atividade.notas && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-700">{atividade.notas}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditAtividade(atividade)}
                        title="Editar atividade"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAtividade(atividade.id)}
                        title="Excluir atividade"
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

      {/* Dialog para adicionar atividade */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{editingAtividade ? 'Editar Atividade' : 'Adicionar Atividade'}</h2>
              <p className="text-sm text-gray-600 mt-1">{editingAtividade ? 'Atualize os dados da atividade' : 'Preencha os dados da atividade'}</p>
            </div>
            <div className="p-6 space-y-4">
              <FornecedorSelect
                tipo="atividade"
                value={formData.fornecedorId}
                onChange={(fornecedorId) => setFormData({ ...formData, fornecedorId, tarifaId: '' })}
                label="Fornecedor da Atividade"
                placeholder="Selecione o fornecedor (opcional)..."
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
              <div>
                <Label htmlFor="nome">Nome da Atividade *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Observação de aves na Mata Atlântica"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    value={formData.localizacao}
                    onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                    placeholder="Local da atividade"
                  />
                </div>
                <div>
                  <Label htmlFor="quantidadeMaxima">Capacidade Máxima</Label>
                  <Input
                    id="quantidadeMaxima"
                    type="number"
                    value={formData.quantidadeMaxima}
                    onChange={(e) => setFormData({ ...formData, quantidadeMaxima: e.target.value })}
                    placeholder="Número de pessoas"
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
                  placeholder="Informações adicionais sobre a atividade..."
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
                  setEditingAtividade(null)
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddAtividade} disabled={loading}>
                {loading
                  ? `${editingAtividade ? 'Atualizando' : 'Adicionando'}...`
                  : editingAtividade
                  ? 'Atualizar Atividade'
                  : 'Adicionar Atividade'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
