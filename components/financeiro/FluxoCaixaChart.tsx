"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts'

interface FluxoCaixaChartProps {
  data: Array<{
    mes: string
    mesCompleto: string
    entradas: number
    saidas: number
    saldo: number
  }>
}

export function FluxoCaixaChart({ data }: FluxoCaixaChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-semibold mb-2">{payload[0]?.payload?.mesCompleto}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Entradas:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(payload[0]?.value || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Saídas:</span>
              <span className="font-medium text-red-600">
                {formatCurrency(payload[1]?.value || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Saldo:</span>
              <span className={`font-bold ${
                (payload[2]?.value || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {formatCurrency(payload[2]?.value || 0)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
        <CardDescription>
          Entradas, saídas e saldo mensal dos últimos {data.length} meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="mes" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  entradas: 'Entradas',
                  saidas: 'Saídas',
                  saldo: 'Saldo'
                }
                return labels[value] || value
              }}
            />
            <Bar 
              dataKey="entradas" 
              fill="hsl(142, 76%, 36%)" 
              radius={[4, 4, 0, 0]}
              name="entradas"
            />
            <Bar 
              dataKey="saidas" 
              fill="hsl(0, 84%, 60%)" 
              radius={[4, 4, 0, 0]}
              name="saidas"
            />
            <Line 
              type="monotone" 
              dataKey="saldo" 
              stroke="hsl(221, 83%, 53%)" 
              strokeWidth={3}
              dot={{ fill: 'hsl(221, 83%, 53%)', r: 4 }}
              name="saldo"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
