import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { logAuditoria } from '@/lib/services/auditoria'
import { alertsCache } from '@/lib/cache/alerts-cache'

// PATCH /api/os/[id]/guias/[guiaDesignacaoId] - Atualizar designação de guia
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; guiaDesignacaoId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, guiaDesignacaoId } = params
    const body = await request.json()

    const { funcao } = body

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

    // Buscar designação atual
    const designacaoAtual = await prisma.guiaDesignacao.findFirst({
      where: {
        id: guiaDesignacaoId,
        osId,
      },
      include: {
        guia: true,
      },
    })

    if (!designacaoAtual) {
      return NextResponse.json(
        { success: false, error: 'Designação não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar designação
    const designacaoAtualizada = await prisma.guiaDesignacao.update({
      where: { id: guiaDesignacaoId },
      data: {
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
        acao: 'atualizar',
        entidade: 'guia_designacao',
        entidadeId: guiaDesignacaoId,
        dadosAntigos: {
          funcao: designacaoAtual.funcao,
        },
        dadosNovos: {
          funcao: designacaoAtualizada.funcao,
        },
        campos: ['funcao'],
        descricao: `Função do guia ${designacaoAtual.guia.nome} atualizada`,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    return NextResponse.json({
      success: true,
      data: designacaoAtualizada,
      message: 'Designação atualizada com sucesso',
    })
  } catch (error: any) {
    console.error('Update guia designacao error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar designação' },
      { status: 500 }
    )
  }
}

// DELETE /api/os/[id]/guias/[guiaDesignacaoId] - Remover guia da OS
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; guiaDesignacaoId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, guiaDesignacaoId } = params

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

    // Buscar designação
    const designacao = await prisma.guiaDesignacao.findFirst({
      where: {
        id: guiaDesignacaoId,
        osId,
      },
      include: {
        guia: true,
      },
    })

    if (!designacao) {
      return NextResponse.json(
        { success: false, error: 'Designação não encontrada' },
        { status: 404 }
      )
    }

    // Deletar designação
    await prisma.guiaDesignacao.delete({
      where: { id: guiaDesignacaoId },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'excluir',
        entidade: 'guia_designacao',
        entidadeId: guiaDesignacaoId,
        dadosAntigos: {
          guiaId: designacao.guiaId,
          guiaNome: designacao.guia.nome,
          funcao: designacao.funcao,
        },
        descricao: `Guia ${designacao.guia.nome} removido da OS`,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // ✅ Invalidar cache de alertas (pode gerar alerta "OS sem guia")
    alertsCache.invalidate(session.orgId)
    console.log('[Cache] Cache de alertas invalidado após remover guia')

    return NextResponse.json({
      success: true,
      message: 'Guia removido com sucesso',
    })
  } catch (error: any) {
    console.error('Delete guia designacao error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao remover guia' },
      { status: 500 }
    )
  }
}
