"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  RefreshCw, 
  Download, 
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { FinanceiroCards } from '@/components/financeiro/FinanceiroCards'
import { FluxoCaixaChart } from '@/components/financeiro/FluxoCaixaChart'
import { DespesasDetalhadas } from '@/components/financeiro/DespesasDetalhadas'
import { TopFornecedores } from '@/components/financeiro/TopFornecedores'
import { OSPorStatus } from '@/components/financeiro/OSPorStatus'
import { 
  FinanceiroCardsSkeleton,
  FluxoCaixaChartSkeleton,
  DespesasDetalhadasSkeleton,
  TopFornecedoresSkeleton,
  OSPorStatusSkeleton
} from '@/components/financeiro/FinanceiroSkeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'

interface ResumoFinanceiro {
  periodo: {
    tipo: string
    dataInicio: string
    dataFim: string
  }
  resumo: {
    receitas: {
      total: number
      recebido: number
      aReceber: number
      atrasado: number
      quantidadeAtrasados: number
    }
    despesas: {
      total: number
      pagas: number
      aPagar: number
      atrasadas: number
      quantidadeAtrasadas: number
      detalhamento: {
        hospedagem: number
        transporte: number
        atividades: number
        passagens: number
      }
    }
    lucro: {
      estimado: number
      margemPercentual: number
    }
    fluxoCaixa: {
      real: number
      saldoPendente: number
    }
  }
  os: {
    total: number
    porStatus: Array<{
      status: string
      quantidade: number
      valorTotal: number
      valorRecebido: number
    }>
  }
  topFornecedores: Array<{
    fornecedorId: string | null
    fornecedorNome: string
    totalPago: number
    quantidadePagamentos: number
  }>
}

interface FluxoCaixa {
  mes: string
  mesCompleto: string
  entradas: number
  saidas: number
  saldo: number
}

export default function FinanceiroPage() {
  const [loadingResumo, setLoadingResumo] = useState(true)
  const [loadingFluxo, setLoadingFluxo] = useState(true)
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'ano'>('mes')
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null)
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixa[]>([])
  const { toast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const carregarResumo = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoadingResumo(true)
      const res = await fetch(`/api/financeiro/resumo?periodo=${periodo}`, { signal })
      
      if (!res.ok) throw new Error('Erro ao carregar resumo')
      
      const data = await res.json()
      if (data.success) {
        setResumo(data.data)
        
        // Mostrar indicador de cache
        if (data.cached) {
          console.log('[Financeiro] Dados carregados do cache')
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao carregar resumo:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o resumo financeiro',
          variant: 'destructive'
        })
      }
    } finally {
      setLoadingResumo(false)
    }
  }, [periodo, toast])

  const carregarFluxoCaixa = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoadingFluxo(true)
      const res = await fetch('/api/financeiro/fluxo-caixa?meses=6', { signal })
      
      if (!res.ok) throw new Error('Erro ao carregar fluxo de caixa')
      
      const data = await res.json()
      if (data.success) {
        setFluxoCaixa(data.data)
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao carregar fluxo:', error)
      }
    } finally {
      setLoadingFluxo(false)
    }
  }, [])

  const carregarDados = useCallback((forceRefresh = false) => {
    // Cancelar requisições anteriores
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Limpar debounce anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Debounce de 300ms para evitar múltiplas requisições
    debounceTimerRef.current = setTimeout(() => {
      Promise.all([
        carregarResumo(signal),
        carregarFluxoCaixa(signal)
      ])
    }, 300)
  }, [carregarResumo, carregarFluxoCaixa])

  useEffect(() => {
    carregarDados()

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [periodo])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const exportarRelatorio = () => {
    toast({
      title: 'Em desenvolvimento',
      description: 'Funcionalidade de exportação será implementada em breve'
    })
  }

  const isLoading = loadingResumo || loadingFluxo
  const temAlertasFinanceiros = resumo 
    ? (resumo.resumo.receitas.quantidadeAtrasados > 0 || 
       resumo.resumo.despesas.quantidadeAtrasadas > 0)
    : false

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Controle financeiro completo da empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => carregarDados(true)} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportarRelatorio}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Período e Alertas */}
      {resumo && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Período: {formatDate(resumo.periodo.dataInicio)} - {formatDate(resumo.periodo.dataFim)}
            </span>
          </div>
          {temAlertasFinanceiros && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {resumo.resumo.receitas.quantidadeAtrasados + resumo.resumo.despesas.quantidadeAtrasadas} pendências atrasadas
            </Badge>
          )}
        </div>
      )}

      {/* Filtro de Período */}
      <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
        <TabsList>
          <TabsTrigger value="mes">Este Mês</TabsTrigger>
          <TabsTrigger value="trimestre">Trimestre</TabsTrigger>
          <TabsTrigger value="ano">Este Ano</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Cards de Resumo */}
      {loadingResumo ? (
        <FinanceiroCardsSkeleton />
      ) : resumo ? (
        <FinanceiroCards resumo={resumo.resumo} />
      ) : null}

      {/* Gráficos e Detalhamentos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {loadingFluxo ? (
          <FluxoCaixaChartSkeleton />
        ) : fluxoCaixa.length > 0 ? (
          <FluxoCaixaChart data={fluxoCaixa} />
        ) : null}
        
        {loadingResumo ? (
          <DespesasDetalhadasSkeleton />
        ) : resumo ? (
          <DespesasDetalhadas 
            detalhamento={resumo.resumo.despesas.detalhamento}
            total={resumo.resumo.despesas.total}
          />
        ) : null}
      </div>

      {/* Top Fornecedores e OS por Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {loadingResumo ? (
          <TopFornecedoresSkeleton />
        ) : resumo ? (
          <TopFornecedores fornecedores={resumo.topFornecedores} />
        ) : null}
        
        {loadingResumo ? (
          <OSPorStatusSkeleton />
        ) : resumo ? (
          <OSPorStatus 
            osPorStatus={resumo.os.porStatus}
            totalOS={resumo.os.total}
          />
        ) : null}
      </div>

      {/* Informações Adicionais */}
      {resumo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análise do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total de OS</p>
                <p className="text-2xl font-bold">{resumo.os.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Taxa de Recebimento</p>
                <p className="text-2xl font-bold">
                  {resumo.resumo.receitas.total > 0 
                    ? `${((resumo.resumo.receitas.recebido / resumo.resumo.receitas.total) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                <p className={`text-2xl font-bold ${
                  resumo.resumo.lucro.margemPercentual >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resumo.resumo.lucro.margemPercentual.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
