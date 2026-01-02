/**
 * API de Gerenciamento de Notificação Individual
 *
 * DELETE /api/notifications/[id] - Cancela uma notificação
 */

import { NextRequest, NextResponse } from 'next/server'
import { notificationQueue } from '@/lib/jobs/notification-queue'

// DELETE - Cancelar notificação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const success = notificationQueue.cancel(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Notificação não encontrada ou não pode ser cancelada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Notificação cancelada com sucesso',
    })
  } catch (error) {
    console.error('[API Notifications] Erro ao cancelar notificação:', error)
    return NextResponse.json(
      { error: 'Erro ao cancelar notificação' },
      { status: 500 }
    )
  }
}
