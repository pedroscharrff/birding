import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { buscarEstatisticasAuditoria } from '@/lib/services/auditoria'
import { prisma } from '@/lib/db/prisma'

// GET /api/os/[id]/auditoria/stats - Estatísticas de auditoria da OS
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId } = params

    // Verificar se OS existe e pertence à organização
    const os = await prisma.oS.findFirst({
      where: {
        id: osId,
        orgId: session.orgId,
      },
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Buscar estatísticas
    const stats = await buscarEstatisticasAuditoria(osId)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error('[Auditoria] Erro ao buscar estatísticas:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas de auditoria' },
      { status: 500 }
    )
  }
}
