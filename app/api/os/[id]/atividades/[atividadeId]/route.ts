import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { updateAtividadeSchema } from '@/lib/validators/atividade'
import { logAuditoria } from '@/lib/services/auditoria'

// PATCH /api/os/[id]/atividades/[atividadeId] - Atualizar atividade
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; atividadeId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, atividadeId } = params
    const body = await request.json()

    // Validar entrada
    const validatedData = updateAtividadeSchema.parse(body)

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

    // Verificar se atividade existe e pertence à OS
    const existingAtividade = await prisma.atividade.findFirst({
      where: {
        id: atividadeId,
        osId,
      },
    })

    if (!existingAtividade) {
      return NextResponse.json(
        { success: false, error: 'Atividade não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar atividade
    const atividade = await prisma.atividade.update({
      where: { id: atividadeId },
      data: {
        ...validatedData,
        ...(validatedData.data && {
          data: new Date(validatedData.data),
        }),
      },
      include: {
        fornecedor: {
          select: {
            id: true,
            nomeFantasia: true,
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
        entidade: 'atividade',
        entidadeId: atividade.id,
        dadosAntigos: existingAtividade,
        dadosNovos: atividade,
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
      data: atividade,
      message: 'Atividade atualizada com sucesso',
    })
  } catch (error: any) {
    console.error('Update atividade error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar atividade' },
      { status: 500 }
    )
  }
}

// DELETE /api/os/[id]/atividades/[atividadeId] - Deletar atividade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; atividadeId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, atividadeId } = params

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

    // Verificar se atividade existe e pertence à OS
    const existingAtividade = await prisma.atividade.findFirst({
      where: {
        id: atividadeId,
        osId,
      },
    })

    if (!existingAtividade) {
      return NextResponse.json(
        { success: false, error: 'Atividade não encontrada' },
        { status: 404 }
      )
    }

    // Deletar atividade
    await prisma.atividade.delete({
      where: { id: atividadeId },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'excluir',
        entidade: 'atividade',
        entidadeId: atividadeId,
        dadosAntigos: existingAtividade,
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
      message: 'Atividade deletada com sucesso',
    })
  } catch (error: any) {
    console.error('Delete atividade error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao deletar atividade' },
      { status: 500 }
    )
  }
}
