"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Building2, Calendar, DollarSign, Utensils, Copy, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FornecedorSelect } from '@/components/forms/FornecedorSelect'
import { TarifaSelect } from '@/components/forms/TarifaSelect'
import { PresetSelect } from '@/components/forms/PresetSelect'

interface Hospedagem {
  id: string
  hotelNome: string
  checkin: string
  checkout: string
  quartos?: number
  regime?: string
  custoTotal?: number
  moeda: string
  fornecedor?: {
    id: string
    nomeFantasia: string
  }
}

interface OSHospedagensSectionProps {
  osId: string
  hospedagens: Hospedagem[]
  onUpdate: () => void
}

export function OSHospedagensSection({ osId, hospedagens, onUpdate }: OSHospedagensSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingHospedagem, setEditingHospedagem] = useState<Hospedagem | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    checkin: '',
    checkout: '',
    quartos: '',
    tipoQuarto: '',
    regime: '',
    custoTotal: '',
    moeda: 'BRL',
    fornecedorId: '',
    tarifaId: '',
    observacoes: '',
  })

  const tipoQuartoOptions = [
    { value: 'single', label: 'Single' },
    { value: 'duplo', label: 'Duplo' },
    { value: 'duplo_solteiro', label: 'Duplo (2 camas de solteiro)' },
    { value: 'triplo', label: 'Triplo' },
    { value: 'quadruplo', label: 'Quádruplo' },
    { value: 'suite', label: 'Suíte' },
    { value: 'suite_master', label: 'Suíte Master' },
    { value: 'chalé', label: 'Chalé' },
    { value: 'apartamento', label: 'Apartamento' },
  ]

  const regimeOptions = [
    { value: 'sem_cafe', label: 'Sem Café da Manhã' },
    { value: 'cafe', label: 'Café da Manhã' },
    { value: 'meia_pensao', label: 'Meia Pensão' },
    { value: 'pensao_completa', label: 'Pensão Completa' },
    { value: 'all_inclusive', label: 'All Inclusive' },
  ]

  const tipoQuartoLabels: Record<string, string> = {
    single: 'Single',
    duplo: 'Duplo',
    duplo_solteiro: 'Duplo (2 camas de solteiro)',
    triplo: 'Triplo',
    quadruplo: 'Quádruplo',
    suite: 'Suíte',
    suite_master: 'Suíte Master',
    chalé: 'Chalé',
    apartamento: 'Apartamento',
  }

  const regimeLabels: Record<string, string> = {
    sem_cafe: 'Sem Café',
    cafe: 'Café da Manhã',
    meia_pensao: 'Meia Pensão',
    pensao_completa: 'Pensão Completa',
    all_inclusive: 'All Inclusive',
  }

  const resetForm = () => {
    setFormData({
      checkin: '',
      checkout: '',
      quartos: '',
      tipoQuarto: '',
      regime: '',
      custoTotal: '',
      moeda: 'BRL',
      fornecedorId: '',
      tarifaId: '',
      observacoes: '',
    })
  }

  const handleAddHospedagem = async () => {
    // Validação
    if (!formData.fornecedorId) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um fornecedor',
        variant: 'destructive',
      })
      return
    }

    if (!formData.checkin || !formData.checkout) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha as datas de check-in e check-out',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        quartos: formData.quartos ? parseInt(formData.quartos) : undefined,
        custoTotal: formData.custoTotal ? parseFloat(formData.custoTotal) : undefined,
        regime: formData.regime || undefined,
        tipoQuarto: formData.tipoQuarto || undefined,
        tarifaId: formData.tarifaId || undefined,
        observacoes: formData.observacoes || undefined,
      }

      const url = editingHospedagem
        ? `/api/os/${osId}/hospedagens/${editingHospedagem.id}`
        : `/api/os/${osId}/hospedagens`
      const method = editingHospedagem ? 'PATCH' : 'POST'

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
        throw new Error(data.error || `Erro ao ${editingHospedagem ? 'atualizar' : 'adicionar'} hospedagem`)
      }

      toast({
        title: 'Sucesso',
        description: `Hospedagem ${editingHospedagem ? 'atualizada' : 'adicionada'} com sucesso`,
      })

      resetForm()
      setIsDialogOpen(false)
      setEditingHospedagem(null)
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Erro ao ${editingHospedagem ? 'atualizar' : 'adicionar'} hospedagem`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditHospedagem = (hospedagem: Hospedagem) => {
    setEditingHospedagem(hospedagem)
    setFormData({
      checkin: hospedagem.checkin.split('T')[0],
      checkout: hospedagem.checkout.split('T')[0],
      quartos: hospedagem.quartos?.toString() || '',
      tipoQuarto: (hospedagem as any).tipoQuarto || '',
      regime: hospedagem.regime || '',
      custoTotal: hospedagem.custoTotal?.toString() || '',
      moeda: hospedagem.moeda,
      fornecedorId: hospedagem.fornecedor?.id || '',
      tarifaId: '',
      observacoes: (hospedagem as any).observacoes || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteHospedagem = async (hospedagemId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta hospedagem? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const res = await fetch(`/api/os/${osId}/hospedagens/${hospedagemId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao deletar hospedagem')
      }

      toast({
        title: 'Sucesso',
        description: 'Hospedagem deletada com sucesso',
      })

      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar hospedagem',
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

  const calculateNights = (checkin: string, checkout: string) => {
    const start = new Date(checkin)
    const end = new Date(checkout)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleDuplicateHospedagem = (hospedagem: Hospedagem) => {
    setFormData({
      checkin: hospedagem.checkin.split('T')[0],
      checkout: hospedagem.checkout.split('T')[0],
      quartos: hospedagem.quartos?.toString() || '',
      tipoQuarto: (hospedagem as any).tipoQuarto || '',
      regime: hospedagem.regime || '',
      custoTotal: hospedagem.custoTotal?.toString() || '',
      moeda: hospedagem.moeda,
      fornecedorId: hospedagem.fornecedor?.id || '',
      tarifaId: '',
      observacoes: '',
    })
    setIsDialogOpen(true)
    toast({
      title: 'Dados copiados',
      description: 'Os dados da hospedagem foram copiados. Ajuste conforme necessário.',
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hospedagens</CardTitle>
              <CardDescription>
                {hospedagens.length} {hospedagens.length === 1 ? 'hospedagem' : 'hospedagens'} reservadas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Hospedagem
              </Button>
              {hospedagens.length > 0 && (
                <Button variant="outline" onClick={() => setIsBatchDialogOpen(true)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Lançamento em Lote
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hospedagens.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma hospedagem reservada</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Adicionar Primeira Hospedagem
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {hospedagens.map((hospedagem) => (
                <div
                  key={hospedagem.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{hospedagem.hotelNome}</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateHospedagem(hospedagem)}
                            className="h-7 opacity-0 group-hover:opacity-100 transition"
                            title="Duplicar hospedagem"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Duplicar
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditHospedagem(hospedagem)}
                            title="Editar hospedagem"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHospedagem(hospedagem.id)}
                            title="Excluir hospedagem"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Check-in: {format(new Date(hospedagem.checkin), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Check-out: {format(new Date(hospedagem.checkout), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {calculateNights(hospedagem.checkin, hospedagem.checkout)} {calculateNights(hospedagem.checkin, hospedagem.checkout) === 1 ? 'noite' : 'noites'}
                          </span>
                        </div>
                        {hospedagem.quartos && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{hospedagem.quartos} {hospedagem.quartos === 1 ? 'quarto' : 'quartos'}</span>
                          </div>
                        )}
                        {hospedagem.regime && (
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4" />
                            <span>{regimeLabels[hospedagem.regime]}</span>
                          </div>
                        )}
                        {hospedagem.custoTotal && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">{formatCurrency(hospedagem.custoTotal, hospedagem.moeda)}</span>
                          </div>
                        )}
                        {hospedagem.fornecedor && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Fornecedor:</span>
                            <span>{hospedagem.fornecedor.nomeFantasia}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar hospedagem */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{editingHospedagem ? 'Editar Hospedagem' : 'Adicionar Hospedagem'}</h2>
              <p className="text-sm text-gray-600 mt-1">{editingHospedagem ? 'Atualize os dados da hospedagem' : 'Preencha os dados da hospedagem'}</p>
            </div>
            <div className="p-6 space-y-4">
              <FornecedorSelect
                tipo="hotelaria"
                value={formData.fornecedorId}
                onChange={(fornecedorId) => {
                  // Só reseta a tarifa se mudou o fornecedor
                  const shouldResetTarifa = fornecedorId !== formData.fornecedorId
                  setFormData({
                    ...formData,
                    fornecedorId,
                    tarifaId: shouldResetTarifa ? '' : formData.tarifaId,
                    custoTotal: shouldResetTarifa ? '' : formData.custoTotal,
                  })
                }}
                label="Fornecedor (Hotel/Pousada)"
                required
                placeholder="Selecione o hotel/pousada..."
              />
              {formData.fornecedorId && (
                <TarifaSelect
                  fornecedorId={formData.fornecedorId}
                  value={formData.tarifaId}
                  onChange={(tarifaId) => setFormData({ ...formData, tarifaId })}
                  label="Tarifa do Fornecedor"
                  onValorChange={(valor, moeda) => {
                    setFormData({ ...formData, custoTotal: valor.toString(), moeda })
                  }}
                  onTarifaDataChange={(data) => {
                    setFormData({
                      ...formData,
                      tipoQuarto: data.tipoQuarto || formData.tipoQuarto,
                      regime: data.regime || formData.regime,
                      quartos: data.quartos?.toString() || formData.quartos,
                    })
                  }}
                />
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkin">Check-in *</Label>
                  <Input
                    id="checkin"
                    type="date"
                    value={formData.checkin}
                    onChange={(e) => setFormData({ ...formData, checkin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="checkout">Check-out *</Label>
                  <Input
                    id="checkout"
                    type="date"
                    value={formData.checkout}
                    onChange={(e) => setFormData({ ...formData, checkout: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="quartos">Número de Quartos</Label>
                  <Input
                    id="quartos"
                    type="number"
                    value={formData.quartos}
                    onChange={(e) => setFormData({ ...formData, quartos: e.target.value })}
                    placeholder="Quantidade de quartos"
                  />
                </div>
                <PresetSelect
                  id="tipoQuarto"
                  label="Tipo de Quarto"
                  value={formData.tipoQuarto}
                  onChange={(value) => setFormData({ ...formData, tipoQuarto: value })}
                  options={tipoQuartoOptions}
                  placeholder="Selecione o tipo..."
                />
                <PresetSelect
                  id="regime"
                  label="Regime de Alimentação"
                  value={formData.regime}
                  onChange={(value) => setFormData({ ...formData, regime: value })}
                  options={regimeOptions}
                  placeholder="Selecione o regime..."
                />
                <div>
                  <Label htmlFor="custoTotal">Custo Total</Label>
                  <Input
                    id="custoTotal"
                    type="number"
                    step="0.01"
                    value={formData.custoTotal}
                    onChange={(e) => setFormData({ ...formData, custoTotal: e.target.value })}
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
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre a hospedagem..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2 sticky bottom-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                  setEditingHospedagem(null)
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddHospedagem} disabled={loading}>
                {loading
                  ? `${editingHospedagem ? 'Atualizando' : 'Adicionando'}...`
                  : editingHospedagem
                  ? 'Atualizar Hospedagem'
                  : 'Adicionar Hospedagem'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog para lançamento em lote */}
      {isBatchDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Lançamento em Lote de Hospedagens</h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecione uma hospedagem existente como modelo e defina quantas cópias deseja criar
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label>Selecione a hospedagem modelo</Label>
                <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-2">
                  {hospedagens.map((hosp) => (
                    <button
                      key={hosp.id}
                      onClick={() => {
                        handleDuplicateHospedagem(hosp)
                        setIsBatchDialogOpen(false)
                      }}
                      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="font-semibold">{hosp.hotelNome}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {format(new Date(hosp.checkin), 'dd/MM/yyyy')} - {format(new Date(hosp.checkout), 'dd/MM/yyyy')}
                        {hosp.custoTotal && ` • ${formatCurrency(hosp.custoTotal, hosp.moeda)}`}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Clique em uma hospedagem para usá-la como modelo. Você poderá ajustar os dados antes de salvar.
                </p>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2 sticky bottom-0">
              <Button
                variant="outline"
                onClick={() => setIsBatchDialogOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
