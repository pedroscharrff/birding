import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { updateParticipanteSchema } from '@/lib/validators/participante'
import { logAuditoria } from '@/lib/services/auditoria'
import { alertsCache } from '@/lib/cache/alerts-cache'

// PATCH /api/os/[id]/participantes/[participanteId] - Atualizar participante
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; participanteId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, participanteId } = params
    const body = await request.json()

    // Validar entrada
    const validatedData = updateParticipanteSchema.parse(body)

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

    // Verificar se participante existe e pertence à OS (dados antigos)
    const existingParticipante = await prisma.participante.findFirst({
      where: {
        id: participanteId,
        osId,
      },
    })

    if (!existingParticipante) {
      return NextResponse.json(
        { success: false, error: 'Participante não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar participante
    const participante = await prisma.participante.update({
      where: { id: participanteId },
      data: {
        ...validatedData,
        ...(validatedData.passaporteValidade && {
          passaporteValidade: new Date(validatedData.passaporteValidade),
        }),
      },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'atualizar',
        entidade: 'participante',
        entidadeId: participante.id,
        dadosAntigos: existingParticipante,
        dadosNovos: participante,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // Invalidar cache de alertas (passaportes vencidos geram alertas)
    alertsCache.invalidate(session.orgId)
    console.log('[Cache] Cache de alertas invalidado após atualizar participante')

    return NextResponse.json({
      success: true,
      data: participante,
      message: 'Participante atualizado com sucesso',
    })
  } catch (error: any) {
    console.error('Update participante error:', error)

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
      { success: false, error: 'Erro ao atualizar participante' },
      { status: 500 }
    )
  }
}

// DELETE /api/os/[id]/participantes/[participanteId] - Deletar participante
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; participanteId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, participanteId } = params

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

    // Verificar se participante existe e pertence à OS (salvar dados antes de deletar)
    const existingParticipante = await prisma.participante.findFirst({
      where: {
        id: participanteId,
        osId,
      },
    })

    if (!existingParticipante) {
      return NextResponse.json(
        { success: false, error: 'Participante não encontrado' },
        { status: 404 }
      )
    }

    // Deletar participante
    await prisma.participante.delete({
      where: { id: participanteId },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'excluir',
        entidade: 'participante',
        entidadeId: participanteId,
        dadosAntigos: existingParticipante,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // Invalidar cache de alertas (passaportes vencidos geram alertas)
    alertsCache.invalidate(session.orgId)
    console.log('[Cache] Cache de alertas invalidado após deletar participante')

    return NextResponse.json({
      success: true,
      message: 'Participante deletado com sucesso',
    })
  } catch (error: any) {
    console.error('Delete participante error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao deletar participante' },
      { status: 500 }
    )
  }
}
