/**
 * API de Gerenciamento de Notificações
 *
 * POST /api/notifications - Adiciona uma notificação à fila
 * GET /api/notifications - Lista notificações
 * GET /api/notifications/stats - Estatísticas da fila
 */

import { NextRequest, NextResponse } from 'next/server'
import { notificationQueue } from '@/lib/jobs/notification-queue'

// POST - Adicionar notificação à fila
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      type,
      recipient,
      subject,
      message,
      priority = 'normal',
      metadata,
      scheduledFor,
      maxAttempts = 3,
    } = body

    if (!type || !recipient || !message) {
      return NextResponse.json(
        { error: 'type, recipient e message são obrigatórios' },
        { status: 400 }
      )
    }

    const id = notificationQueue.enqueue({
      type,
      recipient,
      subject,
      message,
      priority,
      metadata,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      maxAttempts,
    })

    return NextResponse.json({
      message: 'Notificação adicionada à fila',
      id,
    })
  } catch (error) {
    console.error('[API Notifications] Erro ao adicionar notificação:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar notificação' },
      { status: 500 }
    )
  }
}

// GET - Listar notificações ou obter estatísticas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const statsOnly = searchParams.get('stats') === 'true'

    if (statsOnly) {
      const stats = notificationQueue.getStats()
      return NextResponse.json({ stats })
    }

    if (status) {
      const notifications = notificationQueue.getNotificationsByStatus(
        status as any,
        limit
      )
      return NextResponse.json({ notifications })
    }

    // Retornar estatísticas por padrão
    const stats = notificationQueue.getStats()
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('[API Notifications] Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    )
  }
}
