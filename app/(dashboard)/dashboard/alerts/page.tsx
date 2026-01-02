"use client"

/**
 * Página de Alertas
 *
 * Lista completa de alertas com filtros avançados e paginação.
 * Permite visualizar, filtrar e gerenciar todos os alertas da organização.
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorMessage } from '@/components/ui/error-message'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/app/providers/AuthProvider'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import type { Alert, AlertsCount, AlertCategory } from '@/types/alerts'
import { Filter, RefreshCw } from 'lucide-react'

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info'
type CategoryFilter = 'all' | AlertCategory

export default function AlertsPage() {
  const { user } = useAuth()
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Buscar alertas
  const { data: alertsData, loading, error, refetch } = useApi<{ alerts: Alert[], count: AlertsCount }>(
    user?.organizacao?.id ? `/api/alerts?orgId=${user.organizacao.id}` : ''
  )

  // Filtrar alertas
  const filteredAlerts = useMemo(() => {
    if (!alertsData?.alerts) return []

    let filtered = alertsData.alerts

    // Filtro de severidade
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter)
    }

    // Filtro de categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(alert => alert.category === categoryFilter)
    }

    return filtered
  }, [alertsData?.alerts, severityFilter, categoryFilter])

  // Paginação
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAlerts.slice(startIndex, endIndex)
  }, [filteredAlerts, currentPage])

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)

  // Contadores para os filtros
  const filterCounts = useMemo(() => {
    if (!alertsData?.alerts) return { critical: 0, warning: 0, info: 0 }

    return {
      critical: alertsData.alerts.filter(a => a.severity === 'critical').length,
      warning: alertsData.alerts.filter(a => a.severity === 'warning').length,
      info: alertsData.alerts.filter(a => a.severity === 'info').length,
    }
  }, [alertsData?.alerts])

  const categoryCounts = useMemo(() => {
    if (!alertsData?.alerts) return {}

    return alertsData.alerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [alertsData?.alerts])

  if (loading) {
    return <AlertsPageSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Alertas' },
          ]}
        />
        <ErrorMessage
          title="Erro ao carregar alertas"
          message={error}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Alertas' },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertas e Notificações</h1>
          <p className="text-gray-600 mt-2">
            {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alerta' : 'alertas'}
            {severityFilter !== 'all' || categoryFilter !== 'all' ? ' (filtrado)' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre os alertas por severidade, categoria ou período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Filtro de Severidade */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Severidade
              </label>
              <Select value={severityFilter} onValueChange={(value) => {
                setSeverityFilter(value as SeverityFilter)
                setCurrentPage(1) // Reset página ao filtrar
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todas ({alertsData?.count?.total || alertsData?.alerts?.length || 0})
                  </SelectItem>
                  <SelectItem value="critical">
                    Críticos ({filterCounts.critical})
                  </SelectItem>
                  <SelectItem value="warning">
                    Avisos ({filterCounts.warning})
                  </SelectItem>
                  <SelectItem value="info">
                    Informativos ({filterCounts.info})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Categoria
              </label>
              <Select value={categoryFilter} onValueChange={(value) => {
                setCategoryFilter(value as CategoryFilter)
                setCurrentPage(1) // Reset página ao filtrar
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todas ({alertsData?.alerts?.length || 0})
                  </SelectItem>
                  <SelectItem value="financeiro">
                    Financeiro ({categoryCounts['financeiro'] || 0})
                  </SelectItem>
                  <SelectItem value="operacional">
                    Operacional ({categoryCounts['operacional'] || 0})
                  </SelectItem>
                  <SelectItem value="documentacao">
                    Documentação ({categoryCounts['documentacao'] || 0})
                  </SelectItem>
                  <SelectItem value="fornecedor">
                    Fornecedor ({categoryCounts['fornecedor'] || 0})
                  </SelectItem>
                  <SelectItem value="prazo">
                    Prazo ({categoryCounts['prazo'] || 0})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão para limpar filtros */}
          {(severityFilter !== 'all' || categoryFilter !== 'all') && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSeverityFilter('all')
                  setCategoryFilter('all')
                  setCurrentPage(1)
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">Nenhum alerta encontrado</p>
              <p className="text-sm mt-1">
                {severityFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Tudo está em ordem! Continue assim.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <AlertsPanel
            alerts={paginatedAlerts}
            count={{
              critical: paginatedAlerts.filter(a => a.severity === 'critical').length,
              warning: paginatedAlerts.filter(a => a.severity === 'warning').length,
              info: paginatedAlerts.filter(a => a.severity === 'info').length,
              total: paginatedAlerts.length,
            }}
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages} · {filteredAlerts.length} {filteredAlerts.length === 1 ? 'resultado' : 'resultados'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function AlertsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Filtros Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Alertas Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
