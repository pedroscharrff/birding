/**
 * Refresh Scheduler
 *
 * Gerencia o refresh automático das materialized views para manter
 * estatísticas atualizadas.
 *
 * Este scheduler executa em background e pode ser configurado para
 * rodar em intervalos personalizados.
 *
 * @module lib/services/refresh-scheduler
 */

import { refreshMaterializedViews } from './dashboard-stats'

// Intervalo padrão: 5 minutos
const DEFAULT_INTERVAL = 5 * 60 * 1000

// Intervalo noturno: 15 minutos (23h - 6h)
const NIGHT_INTERVAL = 15 * 60 * 1000

// Horário de pico: 8h - 18h (intervalo menor)
const PEAK_INTERVAL = 3 * 60 * 1000

interface SchedulerOptions {
  interval?: number
  enableSmartScheduling?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
}

class RefreshScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false
  private options: Required<SchedulerOptions>
  private lastRefresh: Date | null = null
  private consecutiveErrors = 0
  private readonly MAX_CONSECUTIVE_ERRORS = 5

  constructor(options: SchedulerOptions = {}) {
    this.options = {
      interval: options.interval || DEFAULT_INTERVAL,
      enableSmartScheduling: options.enableSmartScheduling ?? true,
      onSuccess: options.onSuccess || (() => {}),
      onError: options.onError || ((error) => console.error('[Scheduler] Error:', error)),
    }
  }

  /**
   * Inicia o scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[Scheduler] Já está executando')
      return
    }

    this.isRunning = true
    console.log('[Scheduler] Iniciado com intervalo de', this.options.interval / 1000, 'segundos')

    // Executar imediatamente na primeira vez
    this.refresh()

    // Agendar execuções futuras
    this.scheduleNext()
  }

  /**
   * Para o scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[Scheduler] Não está executando')
      return
    }

    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
    console.log('[Scheduler] Parado')
  }

  /**
   * Executa o refresh manualmente
   */
  async refresh(): Promise<void> {
    if (!this.isRunning) {
      console.warn('[Scheduler] Scheduler não está ativo')
      return
    }

    const startTime = Date.now()

    try {
      console.log('[Scheduler] Iniciando refresh das materialized views...')
      await refreshMaterializedViews()

      const duration = Date.now() - startTime
      this.lastRefresh = new Date()
      this.consecutiveErrors = 0

      console.log(`[Scheduler] Refresh concluído em ${duration}ms`)
      this.options.onSuccess()
    } catch (error) {
      this.consecutiveErrors++
      const duration = Date.now() - startTime

      console.error(`[Scheduler] Erro no refresh após ${duration}ms:`, error)
      this.options.onError(error as Error)

      // Se houver muitos erros consecutivos, aumentar intervalo
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        console.error(
          `[Scheduler] Muitos erros consecutivos (${this.consecutiveErrors}). ` +
            'Aumentando intervalo para 30 minutos.'
        )
        this.options.interval = 30 * 60 * 1000
      }
    }
  }

  /**
   * Agenda a próxima execução
   */
  private scheduleNext(): void {
    if (!this.isRunning) {
      return
    }

    const interval = this.getOptimalInterval()

    this.intervalId = setTimeout(() => {
      this.refresh()
      this.scheduleNext()
    }, interval)
  }

  /**
   * Calcula o intervalo ótimo baseado no horário
   */
  private getOptimalInterval(): number {
    if (!this.options.enableSmartScheduling) {
      return this.options.interval
    }

    const now = new Date()
    const hour = now.getHours()

    // Horário de pico (8h - 18h): intervalo menor
    if (hour >= 8 && hour < 18) {
      return PEAK_INTERVAL
    }

    // Horário noturno (23h - 6h): intervalo maior
    if (hour >= 23 || hour < 6) {
      return NIGHT_INTERVAL
    }

    // Horário normal: intervalo padrão
    return DEFAULT_INTERVAL
  }

  /**
   * Retorna informações sobre o status do scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRefresh: this.lastRefresh,
      nextRefresh: this.intervalId
        ? new Date(Date.now() + this.getOptimalInterval())
        : null,
      consecutiveErrors: this.consecutiveErrors,
      currentInterval: this.getOptimalInterval(),
    }
  }
}

// Instância singleton do scheduler
let schedulerInstance: RefreshScheduler | null = null

/**
 * Obtém ou cria a instância do scheduler
 */
export function getScheduler(options?: SchedulerOptions): RefreshScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new RefreshScheduler(options)
  }
  return schedulerInstance
}

/**
 * Inicia o scheduler global
 */
export function startScheduler(options?: SchedulerOptions): RefreshScheduler {
  const scheduler = getScheduler(options)
  scheduler.start()
  return scheduler
}

/**
 * Para o scheduler global
 */
export function stopScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop()
  }
}

/**
 * Obtém o status do scheduler global
 */
export function getSchedulerStatus() {
  return schedulerInstance?.getStatus() || null
}

/**
 * Executa refresh manual
 */
export async function manualRefresh(): Promise<void> {
  if (!schedulerInstance) {
    throw new Error('Scheduler não foi inicializado')
  }
  await schedulerInstance.refresh()
}
