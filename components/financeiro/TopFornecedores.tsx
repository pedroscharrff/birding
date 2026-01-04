"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, TrendingDown } from 'lucide-react'

interface TopFornecedoresProps {
  fornecedores: Array<{
    fornecedorId: string | null
    fornecedorNome: string
    totalPago: number
    quantidadePagamentos: number
  }>
}

export function TopFornecedores({ fornecedores }: TopFornecedoresProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (fornecedores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Top Fornecedores
          </CardTitle>
          <CardDescription>
            Fornecedores com maiores despesas no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum pagamento a fornecedor registrado no período
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalGeral = fornecedores.reduce((acc, f) => acc + f.totalPago, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Top Fornecedores
        </CardTitle>
        <CardDescription>
          Fornecedores com maiores despesas no período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fornecedores.map((fornecedor, index) => {
            const percentual = totalGeral > 0 ? (fornecedor.totalPago / totalGeral) * 100 : 0
            
            return (
              <div 
                key={fornecedor.fornecedorId || index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-bold text-primary">
                      {index + 1}º
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {fornecedor.fornecedorNome}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {fornecedor.quantidadePagamentos} {fornecedor.quantidadePagamentos === 1 ? 'pagamento' : 'pagamentos'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {percentual.toFixed(1)}% do total
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    {formatCurrency(fornecedor.totalPago)}
                  </p>
                </div>
              </div>
            )
          })}

          <div className="pt-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Pago</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(totalGeral)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
