import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getDashboardStats, refreshMaterializedViews } from '@/lib/services/dashboard-stats'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/dashboard/stats - Obter estatísticas do dashboard
 *
 * Retorna estatísticas agregadas para o dashboard usando materialized views
 * para performance otimizada.
 *
 * Query params:
 * - refresh: boolean (opcional) - Força refresh da materialized view
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)

    const forceRefresh = searchParams.get('refresh') === 'true'

    const stats = await getDashboardStats(session.orgId, forceRefresh)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error('[Dashboard Stats] Erro:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas do dashboard' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboard/stats/refresh - Atualizar materialized views
 *
 * Força o refresh das materialized views. Use com moderação,
 * pois pode impactar performance se executado com muita frequência.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Apenas admins podem forçar refresh
    const user = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { roleGlobal: true },
    })

    if (user?.roleGlobal !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem forçar refresh' },
        { status: 403 }
      )
    }

    const startTime = Date.now()
    await refreshMaterializedViews()
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: 'Materialized views atualizadas com sucesso',
      duration,
    })
  } catch (error: any) {
    console.error('[Dashboard Stats] Erro no refresh:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar estatísticas' },
      { status: 500 }
    )
  }
}
