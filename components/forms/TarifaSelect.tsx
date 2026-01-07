"use client"

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { DollarSign, Calendar, Info, Building2, Utensils } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  // Campos específicos de hotelaria
  tipoQuarto?: string
  regime?: string
  quartos?: number
}

interface TarifaSelectProps {
  fornecedorId: string
  value: string
  onChange: (tarifaId: string, tarifa?: Tarifa) => void
  label?: string
  onValorChange?: (valor: number, moeda: string) => void
  onTarifaDataChange?: (data: { tipoQuarto?: string; regime?: string; quartos?: number }) => void
}

export function TarifaSelect({
  fornecedorId,
  value,
  onChange,
  label = 'Tarifa',
  onValorChange,
  onTarifaDataChange,
}: TarifaSelectProps) {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTarifa, setSelectedTarifa] = useState<Tarifa | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (fornecedorId) {
      fetchTarifas()
    } else {
      setTarifas([])
      setSelectedTarifa(null)
    }
  }, [fornecedorId])

  useEffect(() => {
    if (value && tarifas.length > 0) {
      const tarifa = tarifas.find(t => t.id === value)
      setSelectedTarifa(tarifa || null)
      if (tarifa && onValorChange) {
        onValorChange(tarifa.valor, tarifa.moeda)
      }
    } else {
      setSelectedTarifa(null)
    }
  }, [value, tarifas])

  const fetchTarifas = async () => {
    setLoading(true)
    try {
      console.log('[TarifaSelect] Buscando tarifas para fornecedor:', fornecedorId)
      const res = await fetch(`/api/fornecedores/${fornecedorId}/tarifas?ativas=true`, {
        credentials: 'include',
      })

      const data = await res.json()
      console.log('[TarifaSelect] Resposta da API:', data)

      if (!res.ok || !data.success) {
        console.error('[TarifaSelect] Erro na resposta:', data.error)
        throw new Error(data.error || 'Erro ao buscar tarifas')
      }

      console.log('[TarifaSelect] Tarifas encontradas:', data.data?.length || 0)
      setTarifas(data.data || [])
    } catch (error: any) {
      console.error('[TarifaSelect] Erro ao buscar tarifas:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao buscar tarifas',
        variant: 'destructive',
      })
      setTarifas([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (tarifaId: string) => {
    const tarifa = tarifas.find(t => t.id === tarifaId) || null
    setSelectedTarifa(tarifa)
    onChange(tarifaId, tarifa || undefined)
    if (tarifa && onValorChange) {
      onValorChange(tarifa.valor, tarifa.moeda)
    }
    if (tarifa && onTarifaDataChange) {
      onTarifaDataChange({
        tipoQuarto: tarifa.tipoQuarto,
        regime: tarifa.regime,
        quartos: tarifa.quartos,
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

  const isVigente = (tarifa: Tarifa) => {
    const hoje = new Date()
    const inicio = tarifa.vigenciaInicio ? new Date(tarifa.vigenciaInicio) : null
    const fim = tarifa.vigenciaFim ? new Date(tarifa.vigenciaFim) : null

    if (inicio && inicio > hoje) return false
    if (fim && fim < hoje) return false
    return true
  }

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

  if (!fornecedorId) {
    return null
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading || tarifas.length === 0}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">
          {loading ? 'Carregando tarifas...' : tarifas.length === 0 ? 'Nenhuma tarifa disponível' : 'Selecione uma tarifa...'}
        </option>
        {tarifas.map((tarifa) => (
          <option key={tarifa.id} value={tarifa.id}>
            {tarifa.descricao} - {formatCurrency(tarifa.valor, tarifa.moeda)}
            {tarifa.unidade && ` (${tarifa.unidade})`}
          </option>
        ))}
      </select>

      {selectedTarifa && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-blue-900">{selectedTarifa.descricao}</div>
              <div className="flex items-center gap-2 mt-1 text-blue-700">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {formatCurrency(selectedTarifa.valor, selectedTarifa.moeda)}
                  {selectedTarifa.unidade && ` ${selectedTarifa.unidade}`}
                </span>
              </div>
              {selectedTarifa.tipoQuarto && (
                <div className="flex items-center gap-2 mt-1 text-blue-700">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>
                    {tipoQuartoLabels[selectedTarifa.tipoQuarto] || selectedTarifa.tipoQuarto}
                    {selectedTarifa.quartos && ` • ${selectedTarifa.quartos} ${selectedTarifa.quartos === 1 ? 'quarto' : 'quartos'}`}
                  </span>
                </div>
              )}
              {selectedTarifa.regime && (
                <div className="flex items-center gap-2 mt-1 text-blue-700">
                  <Utensils className="h-3.5 w-3.5" />
                  <span>{regimeLabels[selectedTarifa.regime] || selectedTarifa.regime}</span>
                </div>
              )}
              {(selectedTarifa.vigenciaInicio || selectedTarifa.vigenciaFim) && (
                <div className="flex items-center gap-2 mt-1 text-blue-600 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Vigência: 
                    {selectedTarifa.vigenciaInicio && ` de ${format(new Date(selectedTarifa.vigenciaInicio), 'dd/MM/yyyy', { locale: ptBR })}`}
                    {selectedTarifa.vigenciaFim && ` até ${format(new Date(selectedTarifa.vigenciaFim), 'dd/MM/yyyy', { locale: ptBR })}`}
                    {!selectedTarifa.vigenciaFim && ' (sem data fim)'}
                  </span>
                </div>
              )}
              {selectedTarifa.observacoes && (
                <div className="mt-2 text-xs text-blue-600 italic">
                  {selectedTarifa.observacoes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && tarifas.length === 0 && fornecedorId && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800 font-medium">
            ⚠️ Nenhuma tarifa ativa encontrada
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Este fornecedor não possui tarifas ativas cadastradas ou vigentes. 
            Verifique se as tarifas estão marcadas como "ativas" e dentro do período de vigência.
            O valor deverá ser informado manualmente.
          </p>
        </div>
      )}
    </div>
  )
}
