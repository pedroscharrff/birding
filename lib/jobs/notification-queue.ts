/**
 * Fila de Notificações
 *
 * Sistema de enfileiramento para envio de notificações
 * (email, WhatsApp, SMS, etc.)
 */

export interface Notification {
  id: string
  type: 'email' | 'whatsapp' | 'sms' | 'push'
  recipient: string
  subject?: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  metadata?: Record<string, any>
  createdAt: Date
  scheduledFor?: Date
  attempts: number
  maxAttempts: number
  lastAttemptAt?: Date
  lastError?: string
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
}

interface QueueStats {
  pending: number
  processing: number
  sent: number
  failed: number
  total: number
}

class NotificationQueue {
  private queue: Map<string, Notification>
  private isProcessing: boolean = false
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.queue = new Map()
  }

  /**
   * Adiciona uma notificação à fila
   */
  enqueue(notification: Omit<Notification, 'id' | 'createdAt' | 'attempts' | 'status'>): string {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const fullNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      attempts: 0,
      status: 'pending',
    }

    this.queue.set(id, fullNotification)

    console.log(
      `[NotificationQueue] Notificação enfileirada: ${id} (${notification.type} para ${notification.recipient})`
    )

    return id
  }

  /**
   * Inicia o processamento da fila
   */
  startProcessing(intervalSeconds: number = 30): void {
    if (this.isProcessing) {
      console.log('[NotificationQueue] Processamento já está ativo')
      return
    }

    console.log(
      `[NotificationQueue] Iniciando processamento com intervalo de ${intervalSeconds}s`
    )

    this.isProcessing = true

    // Processar imediatamente
    this.processQueue()

    // Agendar processamentos periódicos
    this.processingInterval = setInterval(
      () => this.processQueue(),
      intervalSeconds * 1000
    )
  }

  /**
   * Para o processamento da fila
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    this.isProcessing = false
    console.log('[NotificationQueue] Processamento parado')
  }

  /**
   * Processa itens pendentes na fila
   */
  private async processQueue(): Promise<void> {
    const now = new Date()
    const pendingNotifications = Array.from(this.queue.values())
      .filter(n => n.status === 'pending')
      .filter(n => !n.scheduledFor || n.scheduledFor <= now)
      .sort((a, b) => {
        // Ordenar por prioridade
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

    if (pendingNotifications.length === 0) {
      return
    }

    console.log(
      `[NotificationQueue] Processando ${pendingNotifications.length} notificações pendentes`
    )

    for (const notification of pendingNotifications) {
      await this.processNotification(notification)
    }
  }

  /**
   * Processa uma notificação individual
   */
  private async processNotification(notification: Notification): Promise<void> {
    // Atualizar status
    notification.status = 'processing'
    notification.attempts++
    notification.lastAttemptAt = new Date()
    this.queue.set(notification.id, notification)

    try {
      // Simular envio de notificação
      // Em produção, aqui você chamaria o serviço real (SendGrid, Twilio, etc.)
      await this.sendNotification(notification)

      // Sucesso
      notification.status = 'sent'
      this.queue.set(notification.id, notification)

      console.log(
        `[NotificationQueue] Notificação enviada com sucesso: ${notification.id}`
      )
    } catch (error) {
      // Falha
      const errorMsg =
        error instanceof Error ? error.message : 'Erro desconhecido'
      notification.lastError = errorMsg

      // Verificar se deve tentar novamente
      if (notification.attempts >= notification.maxAttempts) {
        notification.status = 'failed'
        console.error(
          `[NotificationQueue] Notificação falhou definitivamente após ${notification.attempts} tentativas: ${notification.id}`
        )
      } else {
        notification.status = 'pending'
        console.warn(
          `[NotificationQueue] Notificação falhou (tentativa ${notification.attempts}/${notification.maxAttempts}): ${notification.id}`
        )
      }

      this.queue.set(notification.id, notification)
    }
  }

  /**
   * Envia a notificação (implementação mock)
   */
  private async sendNotification(notification: Notification): Promise<void> {
    // Mock: simular envio com delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Mock: simular falha aleatória (10% de chance)
    if (Math.random() < 0.1) {
      throw new Error('Falha simulada no envio')
    }

    // Em produção, implementar envios reais:
    switch (notification.type) {
      case 'email':
        // await sendEmail(notification.recipient, notification.subject, notification.message)
        break
      case 'whatsapp':
        // await sendWhatsApp(notification.recipient, notification.message)
        break
      case 'sms':
        // await sendSMS(notification.recipient, notification.message)
        break
      case 'push':
        // await sendPushNotification(notification.recipient, notification.message)
        break
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  getStats(): QueueStats {
    const notifications = Array.from(this.queue.values())

    return {
      pending: notifications.filter(n => n.status === 'pending').length,
      processing: notifications.filter(n => n.status === 'processing').length,
      sent: notifications.filter(n => n.status === 'sent').length,
      failed: notifications.filter(n => n.status === 'failed').length,
      total: notifications.length,
    }
  }

  /**
   * Obtém notificações por status
   */
  getNotificationsByStatus(
    status: Notification['status'],
    limit: number = 50
  ): Notification[] {
    return Array.from(this.queue.values())
      .filter(n => n.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  /**
   * Cancela uma notificação
   */
  cancel(id: string): boolean {
    const notification = this.queue.get(id)

    if (!notification) {
      return false
    }

    if (notification.status === 'processing' || notification.status === 'sent') {
      return false
    }

    notification.status = 'cancelled'
    this.queue.set(id, notification)

    console.log(`[NotificationQueue] Notificação cancelada: ${id}`)
    return true
  }

  /**
   * Limpa notificações antigas (enviadas ou falhadas há mais de X dias)
   */
  cleanup(daysOld: number = 7): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    let removed = 0

    for (const [id, notification] of this.queue.entries()) {
      if (
        (notification.status === 'sent' || notification.status === 'failed') &&
        notification.createdAt < cutoffDate
      ) {
        this.queue.delete(id)
        removed++
      }
    }

    console.log(`[NotificationQueue] ${removed} notificações antigas removidas`)
    return removed
  }
}

// Singleton global
export const notificationQueue = new NotificationQueue()
