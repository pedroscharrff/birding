"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorMessage } from '@/components/ui/error-message'
import { useApi } from '@/hooks/useApi'
import type { OS } from '@prisma/client'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import type { Alert, AlertsCount } from '@/types/alerts'
import { useAuth } from '@/app/providers/AuthProvider'
import { OSStatusBadge } from '@/components/os/OSIndicators'
import Link from 'next/link'

interface OSWithCounts extends OS {
  _count: {
    participantes: number
    atividades: number
    hospedagens: number
  }
  agenteResponsavel: {
    id: string
    nome: string
    email: string
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: osList, loading, error, refetch } = useApi<OSWithCounts[]>('/api/os')

  // Buscar alertas
  const { data: alertsData, loading: alertsLoading } = useApi<{ alerts: Alert[], count: AlertsCount }>(
    user?.organizacao?.id ? `/api/alerts?orgId=${user.organizacao.id}` : ''
  )

  // Calcular KPIs
  const stats = useMemo(() => {
    if (!osList) return { total: 0, emAndamento: 0, proximaSemana: 0, pendentes: 0 }

    const hoje = new Date()
    const proximaSemana = addDays(hoje, 7)

    return {
      total: osList.length,
      emAndamento: osList.filter(os => os.status === 'em_andamento').length,
      proximaSemana: osList.filter(os =>
        isAfter(new Date(os.dataInicio), hoje) &&
        isBefore(new Date(os.dataInicio), proximaSemana)
      ).length,
      pendentes: osList.filter(os =>
        os.status === 'reservas_pendentes' ||
        os.status === 'cotacoes'
      ).length,
    }
  }, [osList])

  // Agrupar por status para Kanban preview
  const osPorStatus = useMemo(() => {
    if (!osList) return {}

    return osList.reduce((acc, os) => {
      if (!acc[os.status]) {
        acc[os.status] = []
      }
      acc[os.status].push(os)
      return acc
    }, {} as Record<string, OSWithCounts[]>)
  }, [osList])

  // Próximas chegadas
  const proximasChegadas = useMemo(() => {
    if (!osList) return []

    const hoje = new Date()
    return osList
      .filter(os => isAfter(new Date(os.dataInicio), hoje))
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
      .slice(0, 3)
  }, [osList])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <ErrorMessage
        title="Erro ao carregar dashboard"
        message={error}
        onRetry={refetch}
      />
    )
  }

  const statusConfig = {
    planejamento: { label: 'Planejamento', color: 'gray' },
    cotacoes: { label: 'Cotações', color: 'blue' },
    reservas_pendentes: { label: 'Reservas Pendentes', color: 'yellow' },
    reservas_confirmadas: { label: 'Confirmadas', color: 'green' },
    em_andamento: { label: 'Em Andamento', color: 'purple' },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Visão geral das operações de turismo
        </p>
      </div>

      {/* Painel de Alertas */}
      {!alertsLoading && alertsData && (
        <AlertsPanel
          alerts={alertsData.alerts}
          count={alertsData.count}
        />
      )}

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de OS</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Todas as operações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Em Andamento</CardDescription>
            <CardTitle className="text-3xl">{stats.emAndamento}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Operações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Próxima Semana</CardDescription>
            <CardTitle className="text-3xl">{stats.proximaSemana}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Chegadas programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendências</CardDescription>
            <CardTitle className="text-3xl">{stats.pendentes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Quadro Kanban</CardTitle>
          <CardDescription>
            Visão rápida das operações por status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {osList && osList.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma operação cadastrada ainda
            </p>
          ) : (
            <div className="grid md:grid-cols-5 gap-4">
              {Object.entries(statusConfig).map(([status, config]) => {
                const items = osPorStatus[status] || []
                return (
                  <div key={status} className={`bg-${config.color}-50 p-4 rounded-lg`}>
                    <h3 className={`font-semibold text-sm mb-3 text-${config.color}-700`}>
                      {config.label}
                    </h3>
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="text-xs text-gray-400">Nenhuma OS</p>
                      ) : (
                        items.slice(0, 2).map(os => (
                          <div key={os.id} className={`bg-white p-3 rounded shadow-sm border border-${config.color}-200`}>
                            <p className="text-sm font-medium truncate">{os.titulo}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(os.dataInicio), 'dd MMM', { locale: ptBR })} - {format(new Date(os.dataFim), 'dd MMM', { locale: ptBR })}
                            </p>
                          </div>
                        ))
                      )}
                      {items.length > 2 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{items.length - 2} mais
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximas Chegadas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Chegadas</CardTitle>
        </CardHeader>
        <CardContent>
          {proximasChegadas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma chegada programada para os próximos dias
            </p>
          ) : (
            <div className="space-y-4">
              {proximasChegadas.map(os => (
                <Link key={os.id} href={`/dashboard/os/${os.id}`}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{os.titulo}</p>
                      <p className="text-xs text-gray-500">{os._count.participantes} participantes · {os.destino}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <OSStatusBadge status={os.status} size="sm" />
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {format(new Date(os.dataInicio), 'dd MMM', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* KPIs Skeleton */}
      <div className="grid md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-9 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-gray-50 p-4 rounded-lg">
                <Skeleton className="h-5 w-24 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Próximas Chegadas Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
