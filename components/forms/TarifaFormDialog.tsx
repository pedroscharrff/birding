"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { PresetSelect } from '@/components/forms/PresetSelect'
import { DollarSign, Calendar, Save, X, Building2, Utensils, Info } from 'lucide-react'

interface Tarifa {
  id: string
  descricao: string
  valor: number
  moeda: string
  unidade?: string
  vigenciaInicio?: string
  vigenciaFim?: string
  ativo: boolean
  observacoes?: string
  tipoQuarto?: string
  regime?: string
  quartos?: number
}

interface TarifaFormDialogProps {
  open: boolean
  onClose: () => void
  fornecedorId: string
  fornecedorTipo: string
  tarifa?: Tarifa | null
  onSuccess?: () => void
}

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

const unidadeOptions = [
  { value: 'por pessoa', label: 'Por Pessoa' },
  { value: 'por dia', label: 'Por Dia' },
  { value: 'por noite', label: 'Por Noite' },
  { value: 'por grupo', label: 'Por Grupo' },
  { value: 'por quarto', label: 'Por Quarto' },
  { value: 'por km', label: 'Por Km' },
  { value: 'por hora', label: 'Por Hora' },
  { value: 'fixo', label: 'Valor Fixo' },
]

export function TarifaFormDialog({ 
  open, 
  onClose, 
  fornecedorId, 
  fornecedorTipo,
  tarifa, 
  onSuccess 
}: TarifaFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    moeda: 'BRL',
    unidade: '',
    vigenciaInicio: '',
    vigenciaFim: '',
    ativo: true,
    observacoes: '',
    tipoQuarto: '',
    regime: '',
    quartos: '',
  })

  const isHotelaria = fornecedorTipo === 'hotelaria'

  useEffect(() => {
    if (tarifa) {
      setFormData({
        descricao: tarifa.descricao || '',
        valor: tarifa.valor?.toString() || '',
        moeda: tarifa.moeda || 'BRL',
        unidade: tarifa.unidade || '',
        vigenciaInicio: tarifa.vigenciaInicio ? tarifa.vigenciaInicio.split('T')[0] : '',
        vigenciaFim: tarifa.vigenciaFim ? tarifa.vigenciaFim.split('T')[0] : '',
        ativo: tarifa.ativo ?? true,
        observacoes: tarifa.observacoes || '',
        tipoQuarto: tarifa.tipoQuarto || '',
        regime: tarifa.regime || '',
        quartos: tarifa.quartos?.toString() || '',
      })
    } else {
      setFormData({
        descricao: '',
        valor: '',
        moeda: 'BRL',
        unidade: '',
        vigenciaInicio: '',
        vigenciaFim: '',
        ativo: true,
        observacoes: '',
        tipoQuarto: '',
        regime: '',
        quartos: '',
      })
    }
  }, [tarifa, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.descricao.trim()) {
      toast({ title: 'Atenção', description: 'Descrição é obrigatória', variant: 'destructive' })
      return
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast({ title: 'Atenção', description: 'Valor deve ser maior que zero', variant: 'destructive' })
      return
    }

    setLoading(true)
    
    try {
      const payload = {
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        moeda: formData.moeda,
        unidade: formData.unidade.trim() || undefined,
        vigenciaInicio: formData.vigenciaInicio || undefined,
        vigenciaFim: formData.vigenciaFim || undefined,
        ativo: formData.ativo,
        observacoes: formData.observacoes.trim() || undefined,
        tipoQuarto: formData.tipoQuarto || undefined,
        regime: formData.regime || undefined,
        quartos: formData.quartos ? parseInt(formData.quartos) : undefined,
      }

      const url = tarifa 
        ? `/api/fornecedores/${fornecedorId}/tarifas/${tarifa.id}`
        : `/api/fornecedores/${fornecedorId}/tarifas`
      
      const method = tarifa ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar tarifa')
      }
      
      toast({ 
        title: 'Sucesso', 
        description: tarifa ? 'Tarifa atualizada!' : 'Tarifa criada com sucesso!' 
      })
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao salvar tarifa', 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {tarifa ? 'Editar Tarifa' : 'Nova Tarifa'}
          </DialogTitle>
          <DialogDescription>
            {tarifa 
              ? 'Atualize as informações da tarifa' 
              : 'Preencha os dados da nova tarifa'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informações Básicas
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => updateField('descricao', e.target.value)}
                  placeholder="Ex: Quarto Duplo com Café da Manhã"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => updateField('valor', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moeda">Moeda *</Label>
                  <select
                    id="moeda"
                    value={formData.moeda}
                    onChange={(e) => updateField('moeda', e.target.value)}
                    className="w-full border rounded-md h-10 px-3 bg-white"
                    required
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <PresetSelect
                  id="unidade"
                  label="Unidade"
                  value={formData.unidade}
                  onChange={(value) => updateField('unidade', value)}
                  options={unidadeOptions}
                  placeholder="Selecione..."
                />
              </div>
            </div>
          </div>

          {/* Campos específicos de Hotelaria */}
          {isHotelaria && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informações de Hotelaria
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Estes campos serão preenchidos automaticamente ao selecionar esta tarifa em uma hospedagem.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PresetSelect
                  id="tipoQuarto"
                  label="Tipo de Quarto"
                  value={formData.tipoQuarto}
                  onChange={(value) => updateField('tipoQuarto', value)}
                  options={tipoQuartoOptions}
                  placeholder="Selecione o tipo..."
                />

                <PresetSelect
                  id="regime"
                  label="Regime de Alimentação"
                  value={formData.regime}
                  onChange={(value) => updateField('regime', value)}
                  options={regimeOptions}
                  placeholder="Selecione o regime..."
                />

                <div className="space-y-2">
                  <Label htmlFor="quartos">Número de Quartos</Label>
                  <Input
                    id="quartos"
                    type="number"
                    min="1"
                    value={formData.quartos}
                    onChange={(e) => updateField('quartos', e.target.value)}
                    placeholder="Ex: 1, 2, 3..."
                  />
                  <p className="text-xs text-gray-500">
                    Quantidade de quartos incluídos nesta tarifa
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Vigência */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período de Vigência
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vigenciaInicio">Data de Início</Label>
                <Input
                  id="vigenciaInicio"
                  type="date"
                  value={formData.vigenciaInicio}
                  onChange={(e) => updateField('vigenciaInicio', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Deixe em branco para vigência imediata
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vigenciaFim">Data de Término</Label>
                <Input
                  id="vigenciaFim"
                  type="date"
                  value={formData.vigenciaFim}
                  onChange={(e) => updateField('vigenciaFim', e.target.value)}
                  min={formData.vigenciaInicio || undefined}
                />
                <p className="text-xs text-gray-500">
                  Deixe em branco para vigência indeterminada
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => updateField('ativo', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Tarifa ativa
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              Apenas tarifas ativas aparecem na seleção ao cadastrar serviços em uma OS
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => updateField('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre a tarifa..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : tarifa ? 'Atualizar Tarifa' : 'Criar Tarifa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
