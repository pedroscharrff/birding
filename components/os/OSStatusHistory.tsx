"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, ArrowRight } from 'lucide-react'

interface HistoricoItem {
  id: string
  de?: string
  para: string
  alteradoPor: string
  motivo?: string
  createdAt: string
  usuario: {
    id: string
    nome: string
  }
}

interface OSStatusHistoryProps {
  historico: HistoricoItem[]
}

const STATUS_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  cotacoes: 'Cotações',
  reservas_pendentes: 'Reservas Pendentes',
  reservas_confirmadas: 'Confirmadas',
  documentacao: 'Documentação',
  pronto_para_viagem: 'Pronto p/ Viagem',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  pos_viagem: 'Pós-Viagem',
  cancelada: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  planejamento: 'bg-gray-100 text-gray-700',
  cotacoes: 'bg-blue-100 text-blue-700',
  reservas_pendentes: 'bg-yellow-100 text-yellow-700',
  reservas_confirmadas: 'bg-green-100 text-green-700',
  documentacao: 'bg-indigo-100 text-indigo-700',
  pronto_para_viagem: 'bg-teal-100 text-teal-700',
  em_andamento: 'bg-purple-100 text-purple-700',
  concluida: 'bg-emerald-100 text-emerald-700',
  pos_viagem: 'bg-cyan-100 text-cyan-700',
  cancelada: 'bg-red-100 text-red-700',
}

export function OSStatusHistory({ historico }: OSStatusHistoryProps) {
  if (!historico || historico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Status
          </CardTitle>
          <CardDescription>Acompanhe as mudanças de status desta OS</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">Nenhuma alteração de status registrada</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Status
        </CardTitle>
        <CardDescription>
          {historico.length} {historico.length === 1 ? 'alteração' : 'alterações'} registradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historico.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-start gap-4 pb-4 ${
                index !== historico.length - 1 ? 'border-b' : ''
              }`}
            >
              <div className="flex-shrink-0 w-1 h-full bg-gray-200 rounded-full relative">
                <div className="absolute top-0 w-3 h-3 bg-blue-500 rounded-full -left-1"></div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.de ? (
                    <>
                      <Badge className={STATUS_COLORS[item.de] || 'bg-gray-100'}>
                        {STATUS_LABELS[item.de] || item.de}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">Status inicial:</span>
                  )}
                  <Badge className={STATUS_COLORS[item.para] || 'bg-gray-100'}>
                    {STATUS_LABELS[item.para] || item.para}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    Alterado por <strong>{item.usuario.nome}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(item.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}{' '}
                    ({formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })})
                  </p>
                </div>

                {item.motivo && (
                  <div className="bg-gray-50 border-l-4 border-blue-500 p-3 rounded-r">
                    <p className="text-sm text-gray-700">
                      <strong>Motivo:</strong> {item.motivo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
