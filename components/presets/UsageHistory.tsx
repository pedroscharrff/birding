"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApi } from '@/hooks/useApi'
import { TrendingUp, Tag, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type PresetTipo = 'alergia' | 'restricao' | 'preferencia'

interface PresetCategory {
  id: string
  nome: string
}

interface PresetItem {
  id: string
  label: string
  tipo: PresetTipo
  categoriaId?: string | null
  ativo: boolean
  usoCount: number
  ultimoUso?: string | null
  categoria?: PresetCategory | null
}

interface UsageHistoryProps {
  tipo: PresetTipo
}

export function UsageHistory({ tipo }: UsageHistoryProps) {
  const { data: mostUsed } = useApi<PresetItem[]>(`/api/config/presets/most-used?tipo=${tipo}&limit=15`)

  const topItems = useMemo(() => {
    return (mostUsed || []).filter(item => item.usoCount > 0)
  }, [mostUsed])

  const getTipoColor = (tipo: PresetTipo) => {
    switch(tipo) {
      case 'alergia': return 'bg-red-50 text-red-700 border-red-200'
      case 'restricao': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'preferencia': return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  const getProgressColor = (tipo: PresetTipo) => {
    switch(tipo) {
      case 'alergia': return 'bg-red-500'
      case 'restricao': return 'bg-orange-500'
      case 'preferencia': return 'bg-blue-500'
    }
  }

  const maxUsage = useMemo(() => {
    if (topItems.length === 0) return 1
    return Math.max(...topItems.map(i => i.usoCount))
  }, [topItems])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Histórico de Uso
        </CardTitle>
        <CardDescription>
          Itens mais utilizados no cadastro de participantes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum histórico ainda</p>
            <p className="text-sm mt-1">Os itens aparecerão aqui conforme forem utilizados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topItems.map((item, index) => {
              const percentage = (item.usoCount / maxUsage) * 100

              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.label}</span>
                          {item.categoria && (
                            <Badge variant="outline" className="text-xs">
                              {item.categoria.nome}
                            </Badge>
                          )}
                        </div>
                        {item.ultimoUso && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Clock className="h-3 w-3" />
                            Usado{' '}
                            {formatDistanceToNow(new Date(item.ultimoUso), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={getTipoColor(tipo)}>
                      {item.usoCount} {item.usoCount === 1 ? 'uso' : 'usos'}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden ml-11">
                    <div
                      className={`h-full ${getProgressColor(tipo)} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
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
