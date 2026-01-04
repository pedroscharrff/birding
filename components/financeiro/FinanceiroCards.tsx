"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FinanceiroCardsProps {
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
}

export function FinanceiroCards({ resumo }: FinanceiroCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Receitas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(resumo.receitas.total)}
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Recebido</span>
              <span className="font-medium text-green-600">
                {formatCurrency(resumo.receitas.recebido)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">A Receber</span>
              <span className="font-medium">
                {formatCurrency(resumo.receitas.aReceber)}
              </span>
            </div>
            {resumo.receitas.atrasado > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Atrasado</span>
                <Badge variant="destructive" className="h-5 text-xs">
                  {formatCurrency(resumo.receitas.atrasado)}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas Total</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(resumo.despesas.total)}
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pagas</span>
              <span className="font-medium text-red-600">
                {formatCurrency(resumo.despesas.pagas)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">A Pagar</span>
              <span className="font-medium">
                {formatCurrency(resumo.despesas.aPagar)}
              </span>
            </div>
            {resumo.despesas.atrasadas > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Atrasadas</span>
                <Badge variant="destructive" className="h-5 text-xs">
                  {formatCurrency(resumo.despesas.atrasadas)}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lucro */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro Estimado</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            resumo.lucro.estimado >= 0 ? 'text-blue-600' : 'text-red-600'
          }`}>
            {formatCurrency(resumo.lucro.estimado)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge 
              variant={resumo.lucro.margemPercentual >= 20 ? 'default' : 'secondary'}
              className="text-xs"
            >
              Margem: {formatPercent(resumo.lucro.margemPercentual)}
            </Badge>
            {resumo.lucro.margemPercentual >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Baseado em receitas e custos totais
          </p>
        </CardContent>
      </Card>

      {/* Fluxo de Caixa */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
          <Wallet className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            resumo.fluxoCaixa.real >= 0 ? 'text-purple-600' : 'text-red-600'
          }`}>
            {formatCurrency(resumo.fluxoCaixa.real)}
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Saldo Pendente</span>
              <span className={`font-medium ${
                resumo.fluxoCaixa.saldoPendente >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(resumo.fluxoCaixa.saldoPendente)}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Recebido menos pago no período
          </p>
          {(resumo.receitas.quantidadeAtrasados > 0 || resumo.despesas.quantidadeAtrasadas > 0) && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>
                {resumo.receitas.quantidadeAtrasados + resumo.despesas.quantidadeAtrasadas} pendências
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
