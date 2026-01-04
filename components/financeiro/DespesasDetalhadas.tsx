"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Hotel, 
  Car, 
  Activity, 
  Plane,
  TrendingUp
} from 'lucide-react'

interface DespesasDetalhadasProps {
  detalhamento: {
    hospedagem: number
    transporte: number
    atividades: number
    passagens: number
  }
  total: number
}

export function DespesasDetalhadas({ detalhamento, total }: DespesasDetalhadasProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0%'
    return `${((value / total) * 100).toFixed(1)}%`
  }

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return (value / total) * 100
  }

  const categorias = [
    {
      nome: 'Hospedagem',
      valor: detalhamento.hospedagem,
      icon: Hotel,
      color: 'bg-blue-500'
    },
    {
      nome: 'Transporte',
      valor: detalhamento.transporte,
      icon: Car,
      color: 'bg-green-500'
    },
    {
      nome: 'Atividades',
      valor: detalhamento.atividades,
      icon: Activity,
      color: 'bg-purple-500'
    },
    {
      nome: 'Passagens Aéreas',
      valor: detalhamento.passagens,
      icon: Plane,
      color: 'bg-orange-500'
    }
  ]

  const categoriasOrdenadas = [...categorias].sort((a, b) => b.valor - a.valor)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Despesas por Categoria
        </CardTitle>
        <CardDescription>
          Distribuição dos custos no período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categoriasOrdenadas.map((categoria) => {
            const Icon = categoria.icon
            const percentual = getPercentage(categoria.valor, total)
            
            return (
              <div key={categoria.nome} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${categoria.color} bg-opacity-10`}>
                      <Icon className={`h-4 w-4 ${categoria.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{categoria.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercent(categoria.valor, total)} do total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatCurrency(categoria.valor)}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={percentual} 
                  className="h-2"
                />
              </div>
            )
          })}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Total de Despesas</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
