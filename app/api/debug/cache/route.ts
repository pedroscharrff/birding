import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { alertsCache } from '@/lib/cache/alerts-cache'

// GET /api/debug/cache - Ver estatísticas do cache
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const stats = alertsCache.getStats()

    return NextResponse.json({
      success: true,
      data: {
        cache: stats,
        message: 'Cache de alertas tem TTL de 5 minutos',
      },
    })
  } catch (error: any) {
    console.error('Debug cache error:', error)

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/debug/cache - Invalidar cache manualmente
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Invalidar cache da organização do usuário
    alertsCache.invalidate(session.orgId)

    console.log(`[Cache] Cache invalidado manualmente para orgId: ${session.orgId}`)

    return NextResponse.json({
      success: true,
      message: 'Cache de alertas invalidado com sucesso. Recarregue a página para ver os alertas atualizados.',
    })
  } catch (error: any) {
    console.error('Invalidate cache error:', error)

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/debug/cache - Invalidar TODO o cache
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Apenas admin pode invalidar todo o cache
    if (session.roleGlobal !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem invalidar todo o cache' },
        { status: 403 }
      )
    }

    alertsCache.invalidateAll()

    console.log('[Cache] TODO o cache foi invalidado')

    return NextResponse.json({
      success: true,
      message: 'Todo o cache foi invalidado',
    })
  } catch (error: any) {
    console.error('Invalidate all cache error:', error)

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
