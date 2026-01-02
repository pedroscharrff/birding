/**
 * Serviço de Alertas com Paginação
 *
 * Funções otimizadas para busca paginada de alertas
 */

import { prisma } from '@/lib/db/prisma'
import { Alert, AlertsResponse } from '@/types/alerts'
import { alertsCache } from '@/lib/cache/alerts-cache'
import { getAlertsForOrganization } from './alerts'

export interface PaginatedAlertsParams {
  orgId: string
  page?: number
  pageSize?: number
  severity?: 'critical' | 'warning' | 'info'
  category?: string
  osId?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface PaginatedAlertsResponse {
  alerts: Alert[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  count: {
    critical: number
    warning: number
    info: number
    total: number
  }
}

/**
 * Busca alertas com paginação e filtros
 */
export async function getAlertsPaginated(
  params: PaginatedAlertsParams
): Promise<PaginatedAlertsResponse> {
  const {
    orgId,
    page = 1,
    pageSize = 20,
    severity,
    category,
    osId,
    dateFrom,
    dateTo,
  } = params

  // Buscar todos os alertas (com cache)
  let alertsResponse: AlertsResponse

  // Tentar obter do cache primeiro
  const cached = alertsCache.get(orgId)
  if (cached) {
    alertsResponse = cached
  } else {
    alertsResponse = await getAlertsForOrganization(orgId)
    alertsCache.set(orgId, alertsResponse)
  }

  let filteredAlerts = alertsResponse.alerts

  // Aplicar filtros
  if (severity) {
    filteredAlerts = filteredAlerts.filter(a => a.severity === severity)
  }

  if (category) {
    filteredAlerts = filteredAlerts.filter(a => a.category === category)
  }

  if (osId) {
    filteredAlerts = filteredAlerts.filter(a => a.osId === osId)
  }

  if (dateFrom) {
    filteredAlerts = filteredAlerts.filter(
      a => new Date(a.createdAt) >= dateFrom
    )
  }

  if (dateTo) {
    filteredAlerts = filteredAlerts.filter(a => new Date(a.createdAt) <= dateTo)
  }

  // Calcular paginação
  const total = filteredAlerts.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize

  // Aplicar paginação
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex)

  // Recalcular contadores para os alertas filtrados
  const count = {
    critical: filteredAlerts.filter(a => a.severity === 'critical').length,
    warning: filteredAlerts.filter(a => a.severity === 'warning').length,
    info: filteredAlerts.filter(a => a.severity === 'info').length,
    total: filteredAlerts.length,
  }

  return {
    alerts: paginatedAlerts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    count,
  }
}

/**
 * Busca apenas contadores de alertas (super rápido com cache)
 */
export async function getAlertsCount(orgId: string): Promise<{
  critical: number
  warning: number
  info: number
  total: number
}> {
  // Tentar obter do cache primeiro
  const cached = alertsCache.get(orgId)
  if (cached) {
    return cached.count
  }

  // Se não houver cache, buscar alertas completos
  const alertsResponse = await getAlertsForOrganization(orgId)
  alertsCache.set(orgId, alertsResponse)

  return alertsResponse.count
}
