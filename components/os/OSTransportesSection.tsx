"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Truck, Calendar, DollarSign, MapPin, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FornecedorSelect } from '@/components/forms/FornecedorSelect'
import { TarifaSelect } from '@/components/forms/TarifaSelect'

interface Transporte {
  id: string
  tipo: string
  origem?: string
  destino?: string
  dataPartida?: string
  dataChegada?: string
  custo?: number
  moeda: string
  fornecedor?: {
    id: string
    nomeFantasia: string
  }
}

interface OSTransportesSectionProps {
  osId: string
  transportes: Transporte[]
  onUpdate: () => void
}

export function OSTransportesSection({ osId, transportes, onUpdate }: OSTransportesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingTransporte, setEditingTransporte] = useState<Transporte | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    tipo: '',
    fornecedorId: '',
    origem: '',
    destino: '',
    dataPartida: '',
    dataChegada: '',
    custo: '',
    moeda: 'BRL',
    tarifaId: '',
  })

  const tipoOptions = [
    { value: '', label: 'Selecione...' },
    { value: 'van', label: 'Van' },
    { value: 'quatro_x_quatro', label: '4x4' },
    { value: 'executivo_cidade', label: 'Executivo Cidade' },
    { value: 'executivo_fora_cidade', label: 'Executivo Fora da Cidade' },
    { value: 'aereo_cliente', label: 'Aéreo Cliente' },
    { value: 'aereo_guia', label: 'Aéreo Guia' },
  ]

  const tipoLabels: Record<string, string> = {
    van: 'Van',
    quatro_x_quatro: '4x4',
    executivo_cidade: 'Executivo Cidade',
    executivo_fora_cidade: 'Executivo Fora da Cidade',
    aereo_cliente: 'Aéreo Cliente',
    aereo_guia: 'Aéreo Guia',
  }

  const resetForm = () => {
    setFormData({
      tipo: '',
      fornecedorId: '',
      origem: '',
      destino: '',
      dataPartida: '',
      dataChegada: '',
      custo: '',
      moeda: 'BRL',
      tarifaId: '',
    })
  }

  const handleAddTransporte = async () => {
    if (!formData.tipo) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione o tipo de transporte',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        custo: formData.custo ? parseFloat(formData.custo) : undefined,
        fornecedorId: formData.fornecedorId || undefined,
      }

      const url = editingTransporte
        ? `/api/os/${osId}/transportes/${editingTransporte.id}`
        : `/api/os/${osId}/transportes`
      const method = editingTransporte ? 'PATCH' : 'POST'

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
        throw new Error(data.error || `Erro ao ${editingTransporte ? 'atualizar' : 'adicionar'} transporte`)
      }

      toast({
        title: 'Sucesso',
        description: `Transporte ${editingTransporte ? 'atualizado' : 'adicionado'} com sucesso`,
      })

      resetForm()
      setIsDialogOpen(false)
      setEditingTransporte(null)
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Erro ao ${editingTransporte ? 'atualizar' : 'adicionar'} transporte`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditTransporte = (transporte: Transporte) => {
    setEditingTransporte(transporte)
    setFormData({
      tipo: transporte.tipo,
      fornecedorId: transporte.fornecedor?.id || '',
      origem: transporte.origem || '',
      destino: transporte.destino || '',
      dataPartida: transporte.dataPartida ? transporte.dataPartida.split('T')[0] : '',
      dataChegada: transporte.dataChegada ? transporte.dataChegada.split('T')[0] : '',
      custo: transporte.custo?.toString() || '',
      moeda: transporte.moeda,
      tarifaId: '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteTransporte = async (transporteId: string) => {
    if (!confirm('Tem certeza que deseja excluir este transporte? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const res = await fetch(`/api/os/${osId}/transportes/${transporteId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao deletar transporte')
      }

      toast({
        title: 'Sucesso',
        description: 'Transporte deletado com sucesso',
      })

      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar transporte',
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
              <CardTitle>Transportes</CardTitle>
              <CardDescription>
                {transportes.length} {transportes.length === 1 ? 'transporte' : 'transportes'} programados
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Transporte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transportes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum transporte programado</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Adicionar Primeiro Transporte
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transportes.map((transporte) => (
                <div
                  key={transporte.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{tipoLabels[transporte.tipo] || transporte.tipo}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {(transporte.origem || transporte.destino) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {transporte.origem && <span>{transporte.origem}</span>}
                              {transporte.origem && transporte.destino && <span> → </span>}
                              {transporte.destino && <span>{transporte.destino}</span>}
                            </span>
                          </div>
                        )}
                        {transporte.dataPartida && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Partida: {format(new Date(transporte.dataPartida), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                        {transporte.dataChegada && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Chegada: {format(new Date(transporte.dataChegada), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                        {transporte.custo && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">{formatCurrency(transporte.custo, transporte.moeda)}</span>
                          </div>
                        )}
                        {transporte.fornecedor && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Fornecedor:</span>
                            <span>{transporte.fornecedor.nomeFantasia}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTransporte(transporte)}
                        title="Editar transporte"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTransporte(transporte.id)}
                        title="Excluir transporte"
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

      {/* Dialog para adicionar transporte */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{editingTransporte ? 'Editar Transporte' : 'Adicionar Transporte'}</h2>
              <p className="text-sm text-gray-600 mt-1">{editingTransporte ? 'Atualize os dados do transporte' : 'Preencha os dados do transporte'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="tipo">Tipo de Transporte *</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tipoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <FornecedorSelect
                tipo="transporte"
                value={formData.fornecedorId}
                onChange={(fornecedorId) => setFormData({ ...formData, fornecedorId, tarifaId: '' })}
                label="Fornecedor de Transporte"
                placeholder="Selecione o fornecedor (opcional)..."
              />
              {formData.fornecedorId && (
                <TarifaSelect
                  fornecedorId={formData.fornecedorId}
                  value={formData.tarifaId}
                  onChange={(tarifaId) => setFormData({ ...formData, tarifaId })}
                  label="Tarifa do Fornecedor"
                  onValorChange={(valor, moeda) => {
                    setFormData({ ...formData, custo: valor.toString(), moeda })
                  }}
                />
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origem">Origem</Label>
                  <Input
                    id="origem"
                    value={formData.origem}
                    onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                    placeholder="Local de partida"
                  />
                </div>
                <div>
                  <Label htmlFor="destino">Destino</Label>
                  <Input
                    id="destino"
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    placeholder="Local de chegada"
                  />
                </div>
                <div>
                  <Label htmlFor="dataPartida">Data de Partida</Label>
                  <Input
                    id="dataPartida"
                    type="datetime-local"
                    value={formData.dataPartida}
                    onChange={(e) => setFormData({ ...formData, dataPartida: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dataChegada">Data de Chegada</Label>
                  <Input
                    id="dataChegada"
                    type="datetime-local"
                    value={formData.dataChegada}
                    onChange={(e) => setFormData({ ...formData, dataChegada: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="custo">Custo</Label>
                  <Input
                    id="custo"
                    type="number"
                    step="0.01"
                    value={formData.custo}
                    onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
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
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2 sticky bottom-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                  setEditingTransporte(null)
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddTransporte} disabled={loading}>
                {loading
                  ? `${editingTransporte ? 'Atualizando' : 'Adicionando'}...`
                  : editingTransporte
                  ? 'Atualizar Transporte'
                  : 'Adicionar Transporte'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
