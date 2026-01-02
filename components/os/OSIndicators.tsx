"use client"

/**
 * Indicadores Visuais para OS
 *
 * Exibe badges e ícones para indicar rapidamente o estado de uma OS:
 * - Alertas críticos/avisos
 * - Prazos próximos
 * - Completude (participantes, hospedagens, etc)
 * - Status financeiro
 */

import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, CheckCircle2, Users, Home, Plane, Calendar, DollarSign } from 'lucide-react'
import { differenceInDays, isPast, isBefore, addDays } from 'date-fns'

interface OSIndicatorsProps {
  os: {
    id: string
    status: string
    dataInicio: string | Date
    dataFim: string | Date
    _count?: {
      participantes: number
      hospedagens: number
      transportes?: number
      atividades: number
    }
  }
  alertsCount?: {
    critical: number
    warning: number
  }
  showLabels?: boolean
  compact?: boolean
}

export function OSIndicators({ os, alertsCount, showLabels = false, compact = false }: OSIndicatorsProps) {
  const dataInicio = new Date(os.dataInicio)
  const hoje = new Date()
  const diasAteInicio = differenceInDays(dataInicio, hoje)
  const emAndamento = os.status === 'em_andamento'
  const iniciandoEm48h = diasAteInicio >= 0 && diasAteInicio <= 2 && !emAndamento
  const iniciandoEm7dias = diasAteInicio > 2 && diasAteInicio <= 7 && !emAndamento

  // Indicadores de completude
  const temParticipantes = (os._count?.participantes || 0) > 0
  const temHospedagens = (os._count?.hospedagens || 0) > 0
  const temAtividades = (os._count?.atividades || 0) > 0

  const indicators = []

  // Alertas Críticos
  if (alertsCount && alertsCount.critical > 0) {
    indicators.push({
      icon: AlertTriangle,
      label: `${alertsCount.critical} crítico${alertsCount.critical > 1 ? 's' : ''}`,
      color: 'text-red-600 bg-red-50 border-red-200',
      variant: 'destructive' as const,
      priority: 1,
    })
  }

  // Avisos
  if (alertsCount && alertsCount.warning > 0) {
    indicators.push({
      icon: AlertTriangle,
      label: `${alertsCount.warning} aviso${alertsCount.warning > 1 ? 's' : ''}`,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      variant: 'warning' as const,
      priority: 2,
    })
  }

  // Iniciando em 48h
  if (iniciandoEm48h) {
    indicators.push({
      icon: Clock,
      label: `Inicia em ${diasAteInicio}d`,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      variant: 'warning' as const,
      priority: 3,
    })
  }

  // Iniciando em 7 dias
  if (iniciandoEm7dias) {
    indicators.push({
      icon: Calendar,
      label: `Inicia em ${diasAteInicio}d`,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      variant: 'secondary' as const,
      priority: 4,
    })
  }

  // Sem participantes
  if (!temParticipantes && os.status !== 'planejamento') {
    indicators.push({
      icon: Users,
      label: 'Sem participantes',
      color: 'text-gray-500 bg-gray-50 border-gray-200',
      variant: 'outline' as const,
      priority: 5,
    })
  }

  // Sem hospedagens (se não for planejamento ou cotações)
  if (!temHospedagens && !['planejamento', 'cotacoes'].includes(os.status)) {
    indicators.push({
      icon: Home,
      label: 'Sem hospedagens',
      color: 'text-gray-500 bg-gray-50 border-gray-200',
      variant: 'outline' as const,
      priority: 6,
    })
  }

  // Sem atividades
  if (!temAtividades && os.status !== 'planejamento') {
    indicators.push({
      icon: Calendar,
      label: 'Sem atividades',
      color: 'text-gray-500 bg-gray-50 border-gray-200',
      variant: 'outline' as const,
      priority: 7,
    })
  }

  // Ordenar por prioridade
  indicators.sort((a, b) => a.priority - b.priority)

  // Em modo compacto, mostrar apenas os 3 mais importantes
  const displayIndicators = compact ? indicators.slice(0, 3) : indicators

  if (displayIndicators.length === 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {showLabels && <span>Tudo OK</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {displayIndicators.map((indicator, index) => {
        const Icon = indicator.icon
        return (
          <div
            key={index}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${indicator.color}`}
            title={indicator.label}
          >
            <Icon className="h-3 w-3" />
            {showLabels && <span>{indicator.label}</span>}
            {!showLabels && indicator.priority <= 2 && (
              <span className="font-bold">
                {indicator.priority === 1 ? alertsCount?.critical : alertsCount?.warning}
              </span>
            )}
          </div>
        )
      })}
      {compact && indicators.length > 3 && (
        <span className="text-xs text-gray-400">+{indicators.length - 3}</span>
      )}
    </div>
  )
}

/**
 * Barra de Progresso para Completude da OS
 */
interface OSCompletenessBarProps {
  os: {
    status: string
    _count?: {
      participantes: number
      hospedagens: number
      transportes?: number
      atividades: number
    }
  }
}

export function OSCompletenessBar({ os }: OSCompletenessBarProps) {
  const checks = [
    { label: 'Participantes', done: (os._count?.participantes || 0) > 0 },
    { label: 'Hospedagens', done: (os._count?.hospedagens || 0) > 0 },
    { label: 'Transportes', done: (os._count?.transportes || 0) > 0 },
    { label: 'Atividades', done: (os._count?.atividades || 0) > 0 },
  ]

  const completed = checks.filter(c => c.done).length
  const total = checks.length
  const percentage = (completed / total) * 100

  const getColor = () => {
    if (percentage === 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Completude</span>
        <span className="font-medium text-gray-900">{completed}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Badge de Status com Cor
 */
interface OSStatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

export function OSStatusBadge({ status, size = 'md' }: OSStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    planejamento: { label: 'Planejamento', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    cotacoes: { label: 'Cotações', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    reservas_pendentes: { label: 'Reservas Pendentes', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    reservas_confirmadas: { label: 'Confirmadas', color: 'bg-green-100 text-green-700 border-green-300' },
    documentacao: { label: 'Documentação', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
    pronto_para_viagem: { label: 'Pronto p/ Viagem', color: 'bg-teal-100 text-teal-700 border-teal-300' },
    em_andamento: { label: 'Em Andamento', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    concluida: { label: 'Concluída', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    pos_viagem: { label: 'Pós-Viagem', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
    cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-300' },
  }

  const config = statusConfig[status] || statusConfig.planejamento
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${config.color} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  )
}
