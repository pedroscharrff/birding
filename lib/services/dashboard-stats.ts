/**
 * Dashboard Stats Service
 *
 * Service para buscar estatísticas do dashboard usando materialized views
 * para performance otimizada.
 *
 * @module lib/services/dashboard-stats
 */

import { prisma } from '@/lib/db/prisma'
import { cache } from '@/lib/cache'

// Cache de 5 minutos para estatísticas do dashboard
const STATS_CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Interface para estatísticas do dashboard
 */
export interface DashboardStats {
  orgId: string
  totalOS: number
  osPlanejamento: number
  osCotacoes: number
  osReservasPendentes: number
  osReservasConfirmadas: number
  osDocumentacao: number
  osProntoViagem: number
  osEmAndamento: number
  osConcluida: number
  osPosViagem: number
  osCancelada: number
  osProximaSemana: number
  osProximoMes: number
  totalParticipantes: number
  totalAtividades: number
  totalHospedagens: number
  totalTransportes: number
  ultimaAtualizacao: Date
}

/**
 * Interface para estatísticas de uma OS específica
 */
export interface OSStats {
  osId: string
  orgId: string
  status: string
  dataInicio: Date
  dataFim: Date
  totalParticipantes: number
  totalAtividades: number
  totalHospedagens: number
  totalTransportes: number
  totalPassagens: number
  totalGuias: number
  totalMotoristas: number
  totalAnotacoes: number
  totalReceitas: number
  totalDespesas: number
  saldo: number
  ultimaAtualizacao: Date
}

/**
 * Busca estatísticas do dashboard para uma organização
 *
 * Usa materialized view para performance otimizada
 * e cache em memória para reduzir queries.
 *
 * @param orgId - ID da organização
 * @param forceRefresh - Força atualização da materialized view
 * @returns Estatísticas do dashboard
 */
export async function getDashboardStats(
  orgId: string,
  forceRefresh = false
): Promise<DashboardStats> {
  const cacheKey = `dashboard:stats:${orgId}`

  // Verificar cache
  if (!forceRefresh) {
    const cached = cache.get<DashboardStats>(cacheKey)
    if (cached) {
      return cached
    }
  }

  // Se forceRefresh, atualizar materialized view
  if (forceRefresh) {
    await refreshMaterializedViews()
  }

  // Buscar da materialized view
  const stats = await prisma.$queryRaw<any[]>`
    SELECT
      org_id as "orgId",
      total_os as "totalOS",
      os_planejamento as "osPlanejamento",
      os_cotacoes as "osCotacoes",
      os_reservas_pendentes as "osReservasPendentes",
      os_reservas_confirmadas as "osReservasConfirmadas",
      os_documentacao as "osDocumentacao",
      os_pronto_viagem as "osProntoViagem",
      os_em_andamento as "osEmAndamento",
      os_concluida as "osConcluida",
      os_pos_viagem as "osPosViagem",
      os_cancelada as "osCancelada",
      os_proxima_semana as "osProximaSemana",
      os_proximo_mes as "osProximoMes",
      total_participantes as "totalParticipantes",
      total_atividades as "totalAtividades",
      total_hospedagens as "totalHospedagens",
      total_transportes as "totalTransportes",
      ultima_atualizacao as "ultimaAtualizacao"
    FROM mv_dashboard_stats
    WHERE org_id = ${orgId}
  `

  // Se não houver dados na view, retornar estatísticas zeradas
  if (!stats || stats.length === 0) {
    const emptyStats: DashboardStats = {
      orgId,
      totalOS: 0,
      osPlanejamento: 0,
      osCotacoes: 0,
      osReservasPendentes: 0,
      osReservasConfirmadas: 0,
      osDocumentacao: 0,
      osProntoViagem: 0,
      osEmAndamento: 0,
      osConcluida: 0,
      osPosViagem: 0,
      osCancelada: 0,
      osProximaSemana: 0,
      osProximoMes: 0,
      totalParticipantes: 0,
      totalAtividades: 0,
      totalHospedagens: 0,
      totalTransportes: 0,
      ultimaAtualizacao: new Date(),
    }

    cache.set(cacheKey, emptyStats, STATS_CACHE_TTL)
    return emptyStats
  }

  const result: DashboardStats = {
    ...stats[0],
    totalOS: Number(stats[0].totalOS),
    osPlanejamento: Number(stats[0].osPlanejamento),
    osCotacoes: Number(stats[0].osCotacoes),
    osReservasPendentes: Number(stats[0].osReservasPendentes),
    osReservasConfirmadas: Number(stats[0].osReservasConfirmadas),
    osDocumentacao: Number(stats[0].osDocumentacao),
    osProntoViagem: Number(stats[0].osProntoViagem),
    osEmAndamento: Number(stats[0].osEmAndamento),
    osConcluida: Number(stats[0].osConcluida),
    osPosViagem: Number(stats[0].osPosViagem),
    osCancelada: Number(stats[0].osCancelada),
    osProximaSemana: Number(stats[0].osProximaSemana),
    osProximoMes: Number(stats[0].osProximoMes),
    totalParticipantes: Number(stats[0].totalParticipantes),
    totalAtividades: Number(stats[0].totalAtividades),
    totalHospedagens: Number(stats[0].totalHospedagens),
    totalTransportes: Number(stats[0].totalTransportes),
  }

  // Cachear resultado
  cache.set(cacheKey, result, STATS_CACHE_TTL)

  return result
}

/**
 * Busca estatísticas de uma OS específica
 *
 * @param osId - ID da OS
 * @returns Estatísticas da OS
 */
export async function getOSStats(osId: string): Promise<OSStats | null> {
  const cacheKey = `os:stats:${osId}`

  // Verificar cache
  const cached = cache.get<OSStats>(cacheKey)
  if (cached) {
    return cached
  }

  // Buscar da materialized view
  const stats = await prisma.$queryRaw<any[]>`
    SELECT
      os_id as "osId",
      org_id as "orgId",
      status,
      data_inicio as "dataInicio",
      data_fim as "dataFim",
      total_participantes as "totalParticipantes",
      total_atividades as "totalAtividades",
      total_hospedagens as "totalHospedagens",
      total_transportes as "totalTransportes",
      total_passagens as "totalPassagens",
      total_guias as "totalGuias",
      total_motoristas as "totalMotoristas",
      total_anotacoes as "totalAnotacoes",
      total_receitas as "totalReceitas",
      total_despesas as "totalDespesas",
      saldo,
      ultima_atualizacao as "ultimaAtualizacao"
    FROM mv_os_stats
    WHERE os_id = ${osId}
  `

  if (!stats || stats.length === 0) {
    return null
  }

  const result: OSStats = {
    ...stats[0],
    totalParticipantes: Number(stats[0].totalParticipantes),
    totalAtividades: Number(stats[0].totalAtividades),
    totalHospedagens: Number(stats[0].totalHospedagens),
    totalTransportes: Number(stats[0].totalTransportes),
    totalPassagens: Number(stats[0].totalPassagens),
    totalGuias: Number(stats[0].totalGuias),
    totalMotoristas: Number(stats[0].totalMotoristas),
    totalAnotacoes: Number(stats[0].totalAnotacoes),
    totalReceitas: Number(stats[0].totalReceitas),
    totalDespesas: Number(stats[0].totalDespesas),
    saldo: Number(stats[0].saldo),
  }

  // Cachear resultado (2 minutos)
  cache.set(cacheKey, result, 2 * 60 * 1000)

  return result
}

/**
 * Busca estatísticas de múltiplas OS
 *
 * @param osIds - Array de IDs de OS
 * @returns Map de osId -> OSStats
 */
export async function getBulkOSStats(
  osIds: string[]
): Promise<Map<string, OSStats>> {
  if (osIds.length === 0) {
    return new Map()
  }

  // Buscar da materialized view
  const stats = await prisma.$queryRaw<any[]>`
    SELECT
      os_id as "osId",
      org_id as "orgId",
      status,
      data_inicio as "dataInicio",
      data_fim as "dataFim",
      total_participantes as "totalParticipantes",
      total_atividades as "totalAtividades",
      total_hospedagens as "totalHospedagens",
      total_transportes as "totalTransportes",
      total_passagens as "totalPassagens",
      total_guias as "totalGuias",
      total_motoristas as "totalMotoristas",
      total_anotacoes as "totalAnotacoes",
      total_receitas as "totalReceitas",
      total_despesas as "totalDespesas",
      saldo,
      ultima_atualizacao as "ultimaAtualizacao"
    FROM mv_os_stats
    WHERE os_id = ANY(${osIds}::uuid[])
  `

  const result = new Map<string, OSStats>()

  stats.forEach((stat: any) => {
    result.set(stat.osId, {
      ...stat,
      totalParticipantes: Number(stat.totalParticipantes),
      totalAtividades: Number(stat.totalAtividades),
      totalHospedagens: Number(stat.totalHospedagens),
      totalTransportes: Number(stat.totalTransportes),
      totalPassagens: Number(stat.totalPassagens),
      totalGuias: Number(stat.totalGuias),
      totalMotoristas: Number(stat.totalMotoristas),
      totalAnotacoes: Number(stat.totalAnotacoes),
      totalReceitas: Number(stat.totalReceitas),
      totalDespesas: Number(stat.totalDespesas),
      saldo: Number(stat.saldo),
    })
  })

  return result
}

/**
 * Atualiza as materialized views
 *
 * Esta função deve ser chamada após mudanças significativas nos dados
 * (criação/atualização/exclusão de OS, participantes, etc.)
 */
export async function refreshMaterializedViews(): Promise<void> {
  try {
    await prisma.$executeRaw`SELECT refresh_dashboard_stats()`
    console.log('[Dashboard Stats] Materialized views atualizadas com sucesso')
  } catch (error) {
    console.error('[Dashboard Stats] Erro ao atualizar materialized views:', error)
    throw error
  }
}

/**
 * Invalida o cache de estatísticas de uma organização
 *
 * @param orgId - ID da organização
 */
export function invalidateDashboardCache(orgId: string): void {
  const cacheKey = `dashboard:stats:${orgId}`
  cache.delete(cacheKey)
}

/**
 * Invalida o cache de estatísticas de uma OS
 *
 * @param osId - ID da OS
 */
export function invalidateOSStatsCache(osId: string): void {
  const cacheKey = `os:stats:${osId}`
  cache.delete(cacheKey)
}
