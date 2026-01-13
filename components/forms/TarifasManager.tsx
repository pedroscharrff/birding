"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { TarifaFormDialog } from '@/components/forms/TarifaFormDialog'
import { FornecedorTarifa } from '@/types/financeiro'
import { 
  DollarSign, 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar,
  X,
  Check,
  AlertCircle,
  Building2,
  Utensils
} from 'lucide-react'

interface Fornecedor {
  id: string
  tipo: string
}

interface TarifasManagerProps {
  fornecedorId: string
}

export function TarifasManager({ fornecedorId }: TarifasManagerProps) {
  const { toast } = useToast()
  const [tarifas, setTarifas] = useState<FornecedorTarifa[]>([])
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTarifa, setEditingTarifa] = useState<FornecedorTarifa | null>(null)

  useEffect(() => {
    loadFornecedor()
    loadTarifas()
  }, [fornecedorId])

  const loadFornecedor = async () => {
    try {
      const res = await fetch(`/api/fornecedores/${fornecedorId}`, {
        credentials: 'include',
      })
      const data = await res.json()
      
      if (data.success) {
        setFornecedor(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedor:', error)
    }
  }

  const loadTarifas = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/fornecedores/${fornecedorId}/tarifas`, {
        credentials: 'include',
      })
      const data = await res.json()
      
      if (data.success) {
        setTarifas(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar tarifas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (tarifa: FornecedorTarifa) => {
    setEditingTarifa(tarifa)
    setDialogOpen(true)
  }

  const handleNewTarifa = () => {
    setEditingTarifa(null)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingTarifa(null)
    loadTarifas()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta tarifa?')) return
    
    try {
      const res = await fetch(`/api/fornecedores/${fornecedorId}/tarifas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir')
      }
      
      toast({ title: 'Sucesso', description: 'Tarifa excluída!' })
      loadTarifas()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro ao excluir tarifa', variant: 'destructive' })
    }
  }

  const handleToggleAtivo = async (tarifa: FornecedorTarifa) => {
    try {
      const res = await fetch(`/api/fornecedores/${fornecedorId}/tarifas/${tarifa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ativo: !tarifa.ativo })
      })
      
      const data = await res.json()
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar')
      }
      
      toast({ title: 'Sucesso', description: tarifa.ativo ? 'Tarifa desativada' : 'Tarifa ativada' })
      loadTarifas()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const formatCurrency = (valor: any, moeda: string) => {
    const numericValue = typeof valor === 'number' ? valor : Number(valor)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: moeda,
    }).format(numericValue)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const isVigente = (tarifa: FornecedorTarifa) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    if (tarifa.vigenciaInicio) {
      const inicio = new Date(tarifa.vigenciaInicio)
      if (inicio > hoje) return false
    }
    
    if (tarifa.vigenciaFim) {
      const fim = new Date(tarifa.vigenciaFim)
      if (fim < hoje) return false
    }
    
    return true
  }

  const tipoQuartoLabels: Record<string, string> = {
    single: 'Single',
    duplo: 'Duplo',
    duplo_solteiro: 'Duplo (2 camas)',
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tarifas e Valores
            </CardTitle>
            <CardDescription>Gerencie os valores e tarifas deste fornecedor</CardDescription>
          </div>
          <Button
            onClick={handleNewTarifa}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarifa
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de Tarifas */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando tarifas...</div>
        ) : tarifas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma tarifa cadastrada</p>
            <p className="text-sm mt-1">Clique em "Nova Tarifa" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tarifas.map(tarifa => {
              const vigente = isVigente(tarifa)
              
              return (
                <div
                  key={tarifa.id}
                  className={`p-4 border rounded-lg transition ${
                    tarifa.ativo ? 'bg-white hover:border-gray-400' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{tarifa.descricao}</h4>
                        {!tarifa.ativo && (
                          <Badge variant="outline" className="text-xs">Inativa</Badge>
                        )}
                        {tarifa.ativo && !vigente && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Fora da vigência
                          </Badge>
                        )}
                        {tarifa.ativo && vigente && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            Vigente
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="font-bold text-lg text-gray-900">
                          {formatCurrency(tarifa.valor, tarifa.moeda)}
                        </span>
                        {tarifa.unidade && (
                          <span className="text-gray-500">• {tarifa.unidade}</span>
                        )}
                        {(tarifa.vigenciaInicio || tarifa.vigenciaFim) && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {tarifa.vigenciaInicio && formatDate(tarifa.vigenciaInicio)}
                            {tarifa.vigenciaInicio && tarifa.vigenciaFim && ' até '}
                            {tarifa.vigenciaFim && formatDate(tarifa.vigenciaFim)}
                          </span>
                        )}
                      </div>

                      {/* Informações de Hotelaria */}
                      {(tarifa.tipoQuarto || tarifa.regime || tarifa.quartos) && (
                        <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
                          {tarifa.tipoQuarto && (
                            <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              <Building2 className="h-3 w-3" />
                              {tipoQuartoLabels[tarifa.tipoQuarto] || tarifa.tipoQuarto}
                            </span>
                          )}
                          {tarifa.regime && (
                            <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded">
                              <Utensils className="h-3 w-3" />
                              {regimeLabels[tarifa.regime] || tarifa.regime}
                            </span>
                          )}
                          {tarifa.quartos && (
                            <span className="text-gray-600">
                              {tarifa.quartos} {tarifa.quartos === 1 ? 'quarto' : 'quartos'}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {tarifa.observacoes && (
                        <p className="text-sm text-gray-500 mt-2">{tarifa.observacoes}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleToggleAtivo(tarifa)}
                        title={tarifa.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {tarifa.ativo ? (
                          <X className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-blue-100"
                        onClick={() => handleEdit(tarifa)}
                      >
                        <Pencil className="h-3 w-3 text-blue-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-red-100"
                        onClick={() => handleDelete(tarifa.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Dialog de Tarifa */}
      {fornecedor && (
        <TarifaFormDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          fornecedorId={fornecedorId}
          fornecedorTipo={fornecedor.tipo}
          tarifa={editingTarifa}
          onSuccess={loadTarifas}
        />
      )}
    </Card>
  )
}
