import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { logAuditoria } from '@/lib/services/auditoria'
import { alertsCache } from '@/lib/cache/alerts-cache'

// GET /api/os/[id]/guias - Listar guias designados na OS
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

    // Buscar guias designados
    const guias = await prisma.guiaDesignacao.findMany({
      where: { osId },
      include: {
        guia: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            roleGlobal: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: guias,
    })
  } catch (error: any) {
    console.error('Get guias error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar guias' },
      { status: 500 }
    )
  }
}

// POST /api/os/[id]/guias - Adicionar guia à OS
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId } = params
    const body = await request.json()

    const { guiaId, funcao } = body

    if (!guiaId) {
      return NextResponse.json(
        { success: false, error: 'guiaId é obrigatório' },
        { status: 400 }
      )
    }

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

    // Verificar se guia existe e pertence à organização
    const guia = await prisma.usuario.findFirst({
      where: {
        id: guiaId,
        orgId: session.orgId,
        roleGlobal: 'guia',
        ativo: true,
      },
    })

    if (!guia) {
      return NextResponse.json(
        { success: false, error: 'Guia não encontrado ou inativo' },
        { status: 404 }
      )
    }

    // Verificar se guia já está designado
    const existente = await prisma.guiaDesignacao.findUnique({
      where: {
        osId_guiaId: {
          osId,
          guiaId,
        },
      },
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Guia já está designado para esta OS' },
        { status: 400 }
      )
    }

    // Criar designação
    const designacao = await prisma.guiaDesignacao.create({
      data: {
        osId,
        guiaId,
        funcao: funcao || null,
      },
      include: {
        guia: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            roleGlobal: true,
          },
        },
      },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'criar',
        entidade: 'guia_designacao',
        entidadeId: designacao.id,
        dadosNovos: {
          guiaId: designacao.guiaId,
          guiaNome: guia.nome,
          funcao: designacao.funcao,
        },
        descricao: `Guia ${guia.nome} designado para a OS`,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // ✅ Invalidar cache de alertas (para atualizar alertas de "OS sem guia")
    alertsCache.invalidate(session.orgId)
    console.log('[Cache] Cache de alertas invalidado após adicionar guia')

    // Revalidar cache para atualizar a lista de guias
    revalidatePath(`/dashboard/os/${osId}`)
    revalidatePath('/dashboard/os')

    return NextResponse.json(
      {
        success: true,
        data: designacao,
        message: 'Guia adicionado com sucesso',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create guia designacao error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao adicionar guia' },
      { status: 500 }
    )
  }
}
