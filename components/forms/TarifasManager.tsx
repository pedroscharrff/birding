"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { 
  DollarSign, 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar,
  X,
  Check,
  AlertCircle
} from 'lucide-react'

interface Tarifa {
  id: string
  descricao: string
  valor: number
  moeda: string
  unidade?: string | null
  vigenciaInicio?: string | null
  vigenciaFim?: string | null
  ativo: boolean
  observacoes?: string | null
}

interface TarifasManagerProps {
  fornecedorId: string
}

export function TarifasManager({ fornecedorId }: TarifasManagerProps) {
  const { toast } = useToast()
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    moeda: 'BRL',
    unidade: '',
    vigenciaInicio: '',
    vigenciaFim: '',
    observacoes: '',
  })

  useEffect(() => {
    loadTarifas()
  }, [fornecedorId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.descricao.trim() || !formData.valor) {
      toast({ title: 'Atenção', description: 'Descrição e valor são obrigatórios', variant: 'destructive' })
      return
    }

    try {
      const payload = {
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        moeda: formData.moeda,
        unidade: formData.unidade.trim() || undefined,
        vigenciaInicio: formData.vigenciaInicio || undefined,
        vigenciaFim: formData.vigenciaFim || undefined,
        observacoes: formData.observacoes.trim() || undefined,
      }

      const url = editingId
        ? `/api/fornecedores/${fornecedorId}/tarifas/${editingId}`
        : `/api/fornecedores/${fornecedorId}/tarifas`
      
      const method = editingId ? 'PATCH' : 'POST'
      
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
        description: editingId ? 'Tarifa atualizada!' : 'Tarifa criada com sucesso!' 
      })
      
      resetForm()
      loadTarifas()
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao salvar tarifa', 
        variant: 'destructive' 
      })
    }
  }

  const handleEdit = (tarifa: Tarifa) => {
    setEditingId(tarifa.id)
    setFormData({
      descricao: tarifa.descricao,
      valor: tarifa.valor.toString(),
      moeda: tarifa.moeda,
      unidade: tarifa.unidade || '',
      vigenciaInicio: tarifa.vigenciaInicio ? tarifa.vigenciaInicio.split('T')[0] : '',
      vigenciaFim: tarifa.vigenciaFim ? tarifa.vigenciaFim.split('T')[0] : '',
      observacoes: tarifa.observacoes || '',
    })
    setShowForm(true)
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

  const handleToggleAtivo = async (tarifa: Tarifa) => {
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

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      moeda: 'BRL',
      unidade: '',
      vigenciaInicio: '',
      vigenciaFim: '',
      observacoes: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const formatCurrency = (valor: number, moeda: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: moeda,
    }).format(valor)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const isVigente = (tarifa: Tarifa) => {
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
            onClick={() => setShowForm(!showForm)}
            size="sm"
            variant={showForm ? 'outline' : 'default'}
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarifa
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Diária quarto duplo, Guiamento por dia"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moeda">Moeda</Label>
                <select
                  id="moeda"
                  value={formData.moeda}
                  onChange={(e) => setFormData(prev => ({ ...prev, moeda: e.target.value }))}
                  className="w-full border rounded-md h-10 px-3 bg-white"
                >
                  <option value="BRL">BRL - Real</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  value={formData.unidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                  placeholder="Ex: por pessoa, por dia, por km"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vigenciaInicio">Vigência Início</Label>
                <Input
                  id="vigenciaInicio"
                  type="date"
                  value={formData.vigenciaInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, vigenciaInicio: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vigenciaFim">Vigência Fim</Label>
                <Input
                  id="vigenciaFim"
                  type="date"
                  value={formData.vigenciaFim}
                  onChange={(e) => setFormData(prev => ({ ...prev, vigenciaFim: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais sobre esta tarifa"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                {editingId ? 'Atualizar Tarifa' : 'Criar Tarifa'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

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
    </Card>
  )
}
