"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorMessage } from '@/components/ui/error-message'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, CheckCircle, AlertCircle, Clock, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PagamentoForm } from '@/components/forms/PagamentoForm'
import { DespesaPagarDialog } from '@/components/forms/DespesaPagarDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { AuditoriaButton } from '@/components/os/auditoria-button'

interface FinanceiroData {
  resumo: {
    valorVenda: number
    valorRecebido: number
    saldoReceber: number
    custoEstimado: number
    custoReal: number
    margem: number
    margemPercentual: number
    statusPagamento: string
  }
  detalhes: {
    custos: {
      hospedagem: number
      transporte: number
      atividades: number
      passagensAereas: number
      guias: number
      motoristas: number
      outros: number
      total: number
    }
    margem: {
      estimada: {
        valor: number
        percentual: number
      }
      real: {
        valor: number
        percentual: number
      }
    }
  }
  os: {
    valorVenda: number | null
    moedaVenda: string
    valorRecebido: number
    custoEstimado: number | null
    custoReal: number | null
    margemEstimada: number | null
    obsFinanceiras: string | null
  }
}

interface Pagamento {
  id: string
  descricao: string
  valor: number
  dataVencimento: Date
  dataPagamento?: Date
  status: string
  formaPagamento?: string
  fornecedor?: {
    id: string
    nomeFantasia: string
  }
}

interface PagamentosData {
  entradas: {
    total: number
    recebido: number
    pendente: number
    pagamentos: Pagamento[]
  }
  saidas: {
    total: number
    pago: number
    pendente: number
    pagamentos: Pagamento[]
  }
}

interface DespesaItem {
  id: string
  tipo: 'hospedagem' | 'transporte' | 'atividade' | 'passagem_aerea'
  descricao: string
  fornecedor: { id: string; nomeFantasia: string } | null
  valor: number
  moeda: string
  statusPagamento: string
  dataPagamento: Date | null
  formaPagamento: string | null
  referenciaPagamento: string | null
  dataReferencia: Date | null
}

interface DespesasResponse {
  despesas: DespesaItem[]
  totais: {
    total: number
    pago: number
    pendente: number
    porStatus: { pendente: number; pago: number; atrasado: number }
  }
}

interface GrupoFornecedor {
  fornecedor: { id: string; nomeFantasia: string }
  total: number
  pago: number
  pendente: number
  despesas: DespesaItem[]
}

export default function OSFinanceiroPage() {
  const params = useParams()
  const osId = params.id as string

  const [financeiro, setFinanceiro] = useState<FinanceiroData | null>(null)
  const [pagamentos, setPagamentos] = useState<PagamentosData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRecebimentoForm, setShowRecebimentoForm] = useState(false)
  const [showPagamentoForm, setShowPagamentoForm] = useState(false)
  const [fornecedores, setFornecedores] = useState<Array<{ id: string; nomeFantasia: string }>>([])
  const [editingPagamento, setEditingPagamento] = useState<string | null>(null)
  const [despesas, setDespesas] = useState<DespesaItem[]>([])
  const [despesasTotais, setDespesasTotais] = useState<DespesasResponse['totais'] | null>(null)
  const [showDespesaDialog, setShowDespesaDialog] = useState(false)
  const [selectedDespesa, setSelectedDespesa] = useState<DespesaItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fornecedorFilter, setFornecedorFilter] = useState<string>('all')
  const [groupByFornecedor, setGroupByFornecedor] = useState<boolean>(false)
  const [grupos, setGrupos] = useState<GrupoFornecedor[]>([])
  const [osTitle, setOsTitle] = useState<string>('...')

  useEffect(() => {
    loadData()
  }, [osId])

  // Buscar título da OS para breadcrumb
  useEffect(() => {
    let active = true
    async function fetchTitle() {
      try {
        const res = await fetch(`/api/os/${osId}`)
        if (!res.ok) return
        const data = await res.json()
        if (active && data?.data?.titulo) setOsTitle(data.data.titulo)
      } catch {}
    }
    fetchTitle()
    return () => {
      active = false
    }
  }, [osId])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados financeiros
      const [financeiroRes, pagamentosRes, fornecedoresRes, despesasRes] = await Promise.all([
        fetch(`/api/os/${osId}/financeiro`),
        fetch(`/api/os/${osId}/pagamentos`),
        fetch(`/api/fornecedores`),
        fetch(`/api/os/${osId}/despesas${groupByFornecedor ? '?agruparPorFornecedor=true' : ''}`)
      ])

      if (!financeiroRes.ok || !pagamentosRes.ok || !despesasRes.ok) {
        throw new Error('Erro ao carregar dados financeiros')
      }

      const financeiroData = await financeiroRes.json()
      const pagamentosData = await pagamentosRes.json()
      const despesasData = await despesasRes.json()

      setFinanceiro(financeiroData.data)
      setPagamentos(pagamentosData.data)
      if (despesasData?.data) {
        if (groupByFornecedor) {
          setGrupos(despesasData.data || [])
          // quando agrupado, totais podem ser somados dos grupos
          const total = (despesasData.data as GrupoFornecedor[]).reduce((acc: number, g: GrupoFornecedor) => acc + g.total, 0)
          const pago = (despesasData.data as GrupoFornecedor[]).reduce((acc: number, g: GrupoFornecedor) => acc + g.pago, 0)
          setDespesasTotais({ total, pago, pendente: total - pago, porStatus: { pendente: 0, pago: 0, atrasado: 0 } })
          setDespesas([])
        } else {
          setDespesas(despesasData.data.despesas || [])
          setDespesasTotais(despesasData.data.totais || null)
          setGrupos([])
        }
      }

      if (fornecedoresRes.ok) {
        const fornecedoresData = await fornecedoresRes.json()
        setFornecedores(fornecedoresData.data || [])
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePagamento(pagamentoId: string) {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) {
      return
    }

    try {
      const response = await fetch(`/api/os/${osId}/pagamentos/${pagamentoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir pagamento')
      }

      await loadData()
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir pagamento')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      pago: { label: 'Pago', variant: 'default' },
      parcial: { label: 'Parcial', variant: 'secondary' },
      pendente: { label: 'Pendente', variant: 'outline' },
      atrasado: { label: 'Atrasado', variant: 'destructive' },
      cancelado: { label: 'Cancelado', variant: 'outline' }
    }

    const config = statusConfig[status] || statusConfig.pendente
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'atrasado':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <ErrorMessage
        title="Erro ao carregar dados financeiros"
        message={error}
        onRetry={loadData}
      />
    )
  }

  if (!financeiro || !pagamentos) {
    return <div>Dados não encontrados</div>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Operações', href: '/dashboard/os' },
          { label: osTitle, href: `/dashboard/os/${osId}` },
          { label: 'Financeiro' },
        ]}
      />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600 mt-1">
            Controle financeiro completo da operação
          </p>
        </div>
        <AuditoriaButton osId={osId} />
      </div>

      {/* KPIs Principais */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Valor de Venda</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {formatCurrency(financeiro.resumo.valorVenda)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Valor Recebido</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(financeiro.resumo.valorRecebido)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              Saldo: {formatCurrency(financeiro.resumo.saldoReceber)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Custo Real</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatCurrency(financeiro.resumo.custoReal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              Estimado: {formatCurrency(financeiro.resumo.custoEstimado)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Margem de Lucro</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {financeiro.resumo.margem >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <span className={financeiro.resumo.margem >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(financeiro.resumo.margem)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              {financeiro.resumo.margemPercentual.toFixed(2)}% da receita
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento de Custos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Custos</CardTitle>
          <CardDescription>Breakdown por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(financeiro.detalhes.custos).map(([key, value]) => {
              if (key === 'total') return null
              const labels: Record<string, string> = {
                hospedagem: 'Hospedagem',
                transporte: 'Transporte',
                atividades: 'Atividades',
                passagensAereas: 'Passagens Aéreas',
                guias: 'Guias',
                motoristas: 'Motoristas',
                outros: 'Outros'
              }
              const percent = financeiro.detalhes.custos.total > 0
                ? ((value as number) / financeiro.detalhes.custos.total) * 100
                : 0

              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{labels[key]}</span>
                      <span className="text-sm text-gray-600">{formatCurrency(value as number)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="pt-3 border-t flex items-center justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(financeiro.detalhes.custos.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Despesas da Operação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Despesas da Operação</CardTitle>
              <CardDescription>Consolidação de hospedagens, transportes, atividades e passagens</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fornecedorFilter} onValueChange={(v) => setFornecedorFilter(v)}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Fornecedores</SelectItem>
                  {fornecedores.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nomeFantasia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant={groupByFornecedor ? 'default' : 'outline'} size="sm" onClick={async () => {
                setGroupByFornecedor(prev => !prev)
                // recarrega despesas com o novo modo
                await loadData()
              }}>
                {groupByFornecedor ? 'Agrupado: Fornecedor' : 'Agrupar por fornecedor'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {despesasTotais && (
            <div className="mb-4 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-semibold">{formatCurrency(despesasTotais.total)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pago</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(despesasTotais.pago)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendente</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(despesasTotais.pendente)}</p>
              </div>
            </div>
          )}

          {!groupByFornecedor && (
            <div className="space-y-2">
              {despesas.filter(d => (statusFilter === 'all' ? true : d.statusPagamento === statusFilter) && (fornecedorFilter === 'all' ? true : d.fornecedor?.id === fornecedorFilter)).length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhuma despesa encontrada</p>
              ) : (
                despesas
                  .filter(d => (statusFilter === 'all' ? true : d.statusPagamento === statusFilter) && (fornecedorFilter === 'all' ? true : d.fornecedor?.id === fornecedorFilter))
                  .map((d) => (
                  <div key={`${d.tipo}-${d.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(d.statusPagamento)}
                      <div className="flex-1">
                        <p className="font-medium">{d.descricao}</p>
                        <p className="text-sm text-gray-500">
                          {d.fornecedor ? `${d.fornecedor.nomeFantasia} • ` : ''}
                          {d.dataPagamento ? `Pago: ${format(new Date(d.dataPagamento), 'dd/MM/yyyy', { locale: ptBR })}` : (d.dataReferencia ? `Ref: ${format(new Date(d.dataReferencia), 'dd/MM/yyyy', { locale: ptBR })}` : '')}
                          {d.formaPagamento ? ` • ${d.formaPagamento}` : ''}
                          {d.referenciaPagamento ? ` • ${d.referenciaPagamento}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(d.valor)}</p>
                      </div>
                      {getStatusBadge(d.statusPagamento)}
                      {d.statusPagamento !== 'pago' && (
                        <Button size="sm" onClick={() => { setSelectedDespesa(d); setShowDespesaDialog(true) }}>
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {groupByFornecedor && (
            <div className="space-y-4">
              {grupos.filter(g => (fornecedorFilter === 'all' ? true : g.fornecedor.id === fornecedorFilter)).length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhum grupo encontrado</p>
              ) : (
                grupos
                  .filter(g => (fornecedorFilter === 'all' ? true : g.fornecedor.id === fornecedorFilter))
                  .map((g) => {
                  const despesasFiltradas = g.despesas.filter(d => (statusFilter === 'all' ? true : d.statusPagamento === statusFilter))
                  return (
                    <div key={g.fornecedor.id} className="border rounded-lg">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg">
                        <div className="font-medium">{g.fornecedor.nomeFantasia}</div>
                        <div className="text-sm">
                          <span className="mr-3">Total: {formatCurrency(g.total)}</span>
                          <span className="mr-3 text-green-600">Pago: {formatCurrency(g.pago)}</span>
                          <span className="text-red-600">Pendente: {formatCurrency(g.total - g.pago)}</span>
                        </div>
                      </div>
                      <div className="divide-y">
                        {despesasFiltradas.length === 0 ? (
                          <p className="text-center text-gray-500 py-3">Sem despesas com este status</p>
                        ) : (
                          despesasFiltradas.map(d => (
                            <div key={`${d.tipo}-${d.id}`} className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3 flex-1">
                                {getStatusIcon(d.statusPagamento)}
                                <div className="flex-1">
                                  <p className="font-medium">{d.descricao}</p>
                                  <p className="text-sm text-gray-500">
                                    {d.dataPagamento ? `Pago: ${format(new Date(d.dataPagamento), 'dd/MM/yyyy', { locale: ptBR })}` : (d.dataReferencia ? `Ref: ${format(new Date(d.dataReferencia), 'dd/MM/yyyy', { locale: ptBR })}` : '')}
                                    {d.formaPagamento ? ` • ${d.formaPagamento}` : ''}
                                    {d.referenciaPagamento ? ` • ${d.referenciaPagamento}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(d.valor)}</p>
                                </div>
                                {getStatusBadge(d.statusPagamento)}
                                {d.statusPagamento !== 'pago' && (
                                  <Button size="sm" onClick={() => { setSelectedDespesa(d); setShowDespesaDialog(true) }}>
                                    Marcar como Pago
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recebimentos (Entradas) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recebimentos do Cliente</CardTitle>
            <CardDescription>Parcelas e pagamentos recebidos</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowRecebimentoForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Recebimento
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-semibold">{formatCurrency(pagamentos.entradas.total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recebido</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(pagamentos.entradas.recebido)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendente</p>
              <p className="text-lg font-semibold text-yellow-600">{formatCurrency(pagamentos.entradas.pendente)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {pagamentos.entradas.pagamentos.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Nenhum recebimento cadastrado</p>
            ) : (
              pagamentos.entradas.pagamentos.map((pag) => (
                <div key={pag.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(pag.status)}
                    <div className="flex-1">
                      <p className="font-medium">{pag.descricao}</p>
                      <p className="text-sm text-gray-500">
                        Venc: {format(new Date(pag.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        {pag.dataPagamento && ` • Pago: ${format(new Date(pag.dataPagamento), 'dd/MM/yyyy', { locale: ptBR })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(pag.valor)}</p>
                      {pag.formaPagamento && (
                        <p className="text-xs text-gray-500">{pag.formaPagamento}</p>
                      )}
                    </div>
                    {getStatusBadge(pag.status)}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePagamento(pag.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagamentos (Saídas) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pagamentos a Fornecedores</CardTitle>
            <CardDescription>Contas a pagar</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowPagamentoForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Pagamento
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-semibold">{formatCurrency(pagamentos.saidas.total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pago</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(pagamentos.saidas.pago)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendente</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(pagamentos.saidas.pendente)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {pagamentos.saidas.pagamentos.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Nenhum pagamento cadastrado</p>
            ) : (
              pagamentos.saidas.pagamentos.map((pag) => (
                <div key={pag.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(pag.status)}
                    <div className="flex-1">
                      <p className="font-medium">{pag.descricao}</p>
                      <p className="text-sm text-gray-500">
                        {pag.fornecedor && `${pag.fornecedor.nomeFantasia} • `}
                        Venc: {format(new Date(pag.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        {pag.dataPagamento && ` • Pago: ${format(new Date(pag.dataPagamento), 'dd/MM/yyyy', { locale: ptBR })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(pag.valor)}</p>
                    </div>
                    {getStatusBadge(pag.status)}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePagamento(pag.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulários */}
      <PagamentoForm
        open={showRecebimentoForm}
        onOpenChange={setShowRecebimentoForm}
        osId={osId}
        tipo="entrada"
        onSuccess={loadData}
      />

      <PagamentoForm
        open={showPagamentoForm}
        onOpenChange={setShowPagamentoForm}
        osId={osId}
        tipo="saida"
        fornecedores={fornecedores}
        onSuccess={loadData}
      />

      <DespesaPagarDialog
        open={showDespesaDialog}
        onOpenChange={(o) => { setShowDespesaDialog(o); if (!o) setSelectedDespesa(null) }}
        osId={osId}
        despesa={selectedDespesa}
        onSuccess={loadData}
      />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
