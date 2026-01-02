/**
 * Estratégias de Invalidação de Cache
 *
 * Utilitários para invalidar cache de alertas quando
 * entidades relacionadas são modificadas.
 */

import { alertsCache } from './alerts-cache'

/**
 * Invalida cache de alertas para uma organização
 * Deve ser chamado sempre que dados que afetam alertas são modificados
 */
export function invalidateAlertsCache(orgId: string): void {
  alertsCache.invalidate(orgId)
  console.log(`[Cache] Alertas invalidados para organização: ${orgId}`)
}

/**
 * Invalida cache após modificação de OS
 */
export function invalidateCacheOnOSChange(osId: string, orgId: string): void {
  invalidateAlertsCache(orgId)
}

/**
 * Invalida cache após modificação de participante
 */
export function invalidateCacheOnParticipanteChange(
  participanteId: string,
  orgId: string
): void {
  invalidateAlertsCache(orgId)
}

/**
 * Invalida cache após modificação de pagamento
 */
export function invalidateCacheOnPagamentoChange(
  pagamentoId: string,
  orgId: string
): void {
  invalidateAlertsCache(orgId)
}

/**
 * Invalida cache após modificação de hospedagem
 */
export function invalidateCacheOnHospedagemChange(
  hospedagemId: string,
  orgId: string
): void {
  invalidateAlertsCache(orgId)
}

/**
 * Invalida cache após modificação de transporte
 */
export function invalidateCacheOnTransporteChange(
  transporteId: string,
  orgId: string
): void {
  invalidateAlertsCache(orgId)
}

/**
 * Invalida cache após modificação de atividade
 */
export function invalidateCacheOnAtividadeChange(
  atividadeId: string,
  orgId: string
): void {
  invalidateAlertsCache(orgId)
}

/**
 * Invalida cache após mudança de status de OS
 */
export function invalidateCacheOnStatusChange(osId: string, orgId: string): void {
  invalidateAlertsCache(orgId)
}

/**
 * Invalida cache após designação de guia/motorista
 */
export function invalidateCacheOnDesignacaoChange(
  osId: string,
  orgId: string
): void {
  invalidateAlertsCache(orgId)
}

/**
 * Hook genérico para invalidar cache após qualquer mutação
 * que afete alertas
 */
export function createCacheInvalidationHook(orgId: string) {
  return {
    afterCreate: () => invalidateAlertsCache(orgId),
    afterUpdate: () => invalidateAlertsCache(orgId),
    afterDelete: () => invalidateAlertsCache(orgId),
  }
}
