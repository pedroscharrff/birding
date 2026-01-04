"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface OSPorStatusProps {
  osPorStatus: Array<{
    status: string
    quantidade: number
    valorTotal: number
    valorRecebido: number
  }>
  totalOS: number
}

const STATUS_COLORS: Record<string, string> = {
  planejamento: '#94a3b8',
  cotacoes: '#fbbf24',
  reservas_pendentes: '#fb923c',
  reservas_confirmadas: '#60a5fa',
  documentacao: '#a78bfa',
  pronto_para_viagem: '#34d399',
  em_andamento: '#10b981',
  concluida: '#22c55e',
  pos_viagem: '#84cc16',
  cancelada: '#ef4444'
}

const STATUS_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  cotacoes: 'Cotações',
  reservas_pendentes: 'Reservas Pendentes',
  reservas_confirmadas: 'Reservas Confirmadas',
  documentacao: 'Documentação',
  pronto_para_viagem: 'Pronto para Viagem',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  pos_viagem: 'Pós-Viagem',
  cancelada: 'Cancelada'
}

export function OSPorStatus({ osPorStatus, totalOS }: OSPorStatusProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const chartData = osPorStatus.map(item => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.quantidade,
    valorTotal: item.valorTotal,
    valorRecebido: item.valorRecebido
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="font-semibold mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Quantidade:</span>{' '}
              <span className="font-medium">{data.value} OS</span>
            </p>
            <p>
              <span className="text-muted-foreground">Valor Total:</span>{' '}
              <span className="font-medium">{formatCurrency(data.valorTotal)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Recebido:</span>{' '}
              <span className="font-medium text-green-600">{formatCurrency(data.valorRecebido)}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ordens de Serviço por Status
        </CardTitle>
        <CardDescription>
          Distribuição de {totalOS} OS no período
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => {
                    const status = osPorStatus[index].status
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[status] || '#94a3b8'} 
                      />
                    )
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {osPorStatus.map((item) => {
                const percentual = totalOS > 0 ? (item.quantidade / totalOS) * 100 : 0
                const taxaRecebimento = item.valorTotal > 0 
                  ? (item.valorRecebido / item.valorTotal) * 100 
                  : 0

                return (
                  <div 
                    key={item.status}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }}
                      />
                      <span className="text-sm font-medium">
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {item.quantidade} OS ({percentual.toFixed(0)}%)
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.valorTotal)}
                        </p>
                        {taxaRecebimento > 0 && (
                          <p className="text-xs text-green-600 font-medium">
                            {taxaRecebimento.toFixed(0)}% recebido
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma OS registrada no período
          </p>
        )}
      </CardContent>
    </Card>
  )
}
