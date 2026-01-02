/**
 * Job Assíncrono de Atualização de Alertas
 *
 * Recomputa alertas críticos periodicamente e mantém o cache atualizado
 */

import { prisma } from '@/lib/db/prisma'
import { getAlertsForOrganization } from '@/lib/services/alerts'
import { alertsCache } from '@/lib/cache/alerts-cache'

interface JobExecutionLog {
  jobId: string
  startedAt: Date
  finishedAt?: Date
  duration?: number
  organizationsProcessed: number
  alertsGenerated: number
  errors: string[]
}

class AlertsRefreshJob {
  private isRunning: boolean = false
  private intervalId: NodeJS.Timeout | null = null
  private executionLogs: JobExecutionLog[] = []

  /**
   * Inicia o job com execução periódica
   * @param intervalMinutes - Intervalo em minutos (padrão: 60)
   */
  start(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      console.log('[AlertsRefreshJob] Job já está em execução')
      return
    }

    console.log(
      `[AlertsRefreshJob] Iniciando job com intervalo de ${intervalMinutes} minutos`
    )

    // Executar imediatamente
    this.execute()

    // Agendar execuções periódicas
    this.intervalId = setInterval(
      () => this.execute(),
      intervalMinutes * 60 * 1000
    )

    this.isRunning = true
  }

  /**
   * Para o job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
    console.log('[AlertsRefreshJob] Job parado')
  }

  /**
   * Executa o job uma vez
   */
  async execute(): Promise<JobExecutionLog> {
    const jobId = `job-${Date.now()}`
    const startedAt = new Date()
    const errors: string[] = []

    console.log(`[AlertsRefreshJob] Iniciando execução ${jobId}`)

    let organizationsProcessed = 0
    let alertsGenerated = 0

    try {
      // Buscar todas as organizações ativas
      const organizations = await prisma.organizacao.findMany({
        select: {
          id: true,
          nome: true,
        },
      })

      for (const org of organizations) {
        try {
          // Recomputar alertas para a organização
          const alertsResponse = await getAlertsForOrganization(org.id)

          // Atualizar cache
          alertsCache.set(org.id, alertsResponse, 60 * 60 * 1000) // 1 hora

          organizationsProcessed++
          alertsGenerated += alertsResponse.count.total

          console.log(
            `[AlertsRefreshJob] ${org.nome}: ${alertsResponse.count.total} alertas (${alertsResponse.count.critical} críticos)`
          )
        } catch (error) {
          const errorMsg = `Erro ao processar organização ${org.nome}: ${
            error instanceof Error ? error.message : 'Erro desconhecido'
          }`
          errors.push(errorMsg)
          console.error(`[AlertsRefreshJob] ${errorMsg}`)
        }
      }
    } catch (error) {
      const errorMsg = `Erro fatal: ${
        error instanceof Error ? error.message : 'Erro desconhecido'
      }`
      errors.push(errorMsg)
      console.error(`[AlertsRefreshJob] ${errorMsg}`)
    }

    const finishedAt = new Date()
    const duration = finishedAt.getTime() - startedAt.getTime()

    const log: JobExecutionLog = {
      jobId,
      startedAt,
      finishedAt,
      duration,
      organizationsProcessed,
      alertsGenerated,
      errors,
    }

    this.executionLogs.push(log)

    // Manter apenas os últimos 50 logs
    if (this.executionLogs.length > 50) {
      this.executionLogs.shift()
    }

    console.log(
      `[AlertsRefreshJob] Execução ${jobId} concluída em ${duration}ms - ${organizationsProcessed} organizações, ${alertsGenerated} alertas`
    )

    return log
  }

  /**
   * Retorna o status do job
   */
  getStatus(): {
    isRunning: boolean
    lastExecution?: JobExecutionLog
    executionCount: number
  } {
    return {
      isRunning: this.isRunning,
      lastExecution: this.executionLogs[this.executionLogs.length - 1],
      executionCount: this.executionLogs.length,
    }
  }

  /**
   * Retorna o histórico de execuções
   */
  getExecutionLogs(limit: number = 10): JobExecutionLog[] {
    return this.executionLogs.slice(-limit)
  }
}

// Singleton global
export const alertsRefreshJob = new AlertsRefreshJob()
