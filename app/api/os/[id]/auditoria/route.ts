import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { buscarAuditorias } from '@/lib/services/auditoria'
import { prisma } from '@/lib/db/prisma'

// GET /api/os/[id]/auditoria - Listar logs de auditoria da OS
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId } = params
    const { searchParams } = new URL(request.url)

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

    // Extrair filtros dos query params
    const usuarioId = searchParams.get('usuarioId') || undefined
    const acao = searchParams.get('acao') || undefined
    const entidade = searchParams.get('entidade') || undefined
    const entidadeId = searchParams.get('entidadeId') || undefined
    const dataInicio = searchParams.get('dataInicio') || undefined
    const dataFim = searchParams.get('dataFim') || undefined
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    // Buscar auditorias
    const { data, total, fromCache } = await buscarAuditorias({
      osId,
      usuarioId,
      acao,
      entidade,
      entidadeId,
      dataInicio,
      dataFim,
      page,
      limit,
    })

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      metadata: {
        fromCache,
      },
    })
  } catch (error: any) {
    console.error('[Auditoria] Erro ao buscar logs:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar logs de auditoria' },
      { status: 500 }
    )
  }
}
