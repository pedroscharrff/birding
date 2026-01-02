import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { updateHospedagemSchema } from '@/lib/validators/hospedagem'
import { logAuditoria } from '@/lib/services/auditoria'

// PATCH /api/os/[id]/hospedagens/[hospedagemId] - Atualizar hospedagem
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; hospedagemId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, hospedagemId } = params
    const body = await request.json()

    // Validar entrada
    const validatedData = updateHospedagemSchema.parse(body)

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

    // Verificar se hospedagem existe e pertence à OS
    const existingHospedagem = await prisma.hospedagem.findFirst({
      where: {
        id: hospedagemId,
        osId,
      },
    })

    if (!existingHospedagem) {
      return NextResponse.json(
        { success: false, error: 'Hospedagem não encontrada' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (validatedData.checkin !== undefined) updateData.checkin = new Date(validatedData.checkin)
    if (validatedData.checkout !== undefined) updateData.checkout = new Date(validatedData.checkout)
    if (validatedData.quartos !== undefined) updateData.quartos = validatedData.quartos
    if (validatedData.tipoQuarto !== undefined) updateData.tipoQuarto = validatedData.tipoQuarto
    if (validatedData.regime !== undefined) updateData.regime = validatedData.regime
    if (validatedData.custoTotal !== undefined) updateData.custoTotal = validatedData.custoTotal
    if (validatedData.moeda !== undefined) updateData.moeda = validatedData.moeda
    if (validatedData.fornecedorId !== undefined) {
      // Buscar o nome do fornecedor
      const fornecedor = await prisma.fornecedor.findFirst({
        where: {
          id: validatedData.fornecedorId,
          orgId: session.orgId,
        },
        select: {
          nomeFantasia: true,
        },
      })
      if (fornecedor) {
        updateData.fornecedorId = validatedData.fornecedorId
        updateData.hotelNome = fornecedor.nomeFantasia
      }
    }
    if (validatedData.tarifaId !== undefined) updateData.tarifaId = validatedData.tarifaId
    if (validatedData.observacoes !== undefined) updateData.observacoes = validatedData.observacoes
    if (validatedData.reservasRefs !== undefined) updateData.reservasRefs = validatedData.reservasRefs

    // Atualizar hospedagem
    const hospedagem = await prisma.hospedagem.update({
      where: { id: hospedagemId },
      data: updateData,
      include: {
        fornecedor: validatedData.fornecedorId || existingHospedagem.fornecedorId ? {
          select: {
            id: true,
            nomeFantasia: true,
          },
        } : false,
      },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'atualizar',
        entidade: 'hospedagem',
        entidadeId: hospedagem.id,
        dadosAntigos: existingHospedagem,
        dadosNovos: hospedagem,
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
      data: hospedagem,
      message: 'Hospedagem atualizada com sucesso',
    })
  } catch (error: any) {
    console.error('Update hospedagem error:', error)

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
      { success: false, error: 'Erro ao atualizar hospedagem' },
      { status: 500 }
    )
  }
}

// DELETE /api/os/[id]/hospedagens/[hospedagemId] - Deletar hospedagem
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; hospedagemId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, hospedagemId } = params

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

    // Verificar se hospedagem existe e pertence à OS
    const existingHospedagem = await prisma.hospedagem.findFirst({
      where: {
        id: hospedagemId,
        osId,
      },
    })

    if (!existingHospedagem) {
      return NextResponse.json(
        { success: false, error: 'Hospedagem não encontrada' },
        { status: 404 }
      )
    }

    // Deletar hospedagem
    await prisma.hospedagem.delete({
      where: { id: hospedagemId },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'excluir',
        entidade: 'hospedagem',
        entidadeId: hospedagemId,
        dadosAntigos: existingHospedagem,
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
      message: 'Hospedagem deletada com sucesso',
    })
  } catch (error: any) {
    console.error('Delete hospedagem error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao deletar hospedagem' },
      { status: 500 }
    )
  }
}
