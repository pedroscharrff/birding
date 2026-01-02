import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

// PATCH /api/fornecedores/[id]/tarifas/[tarifaId] - Atualizar tarifa
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; tarifaId: string } }
) {
  try {
    const session = await requireAuth()
    const { id, tarifaId } = params
    const body = await request.json()

    // Verificar se o fornecedor existe e pertence à organização
    const fornecedor = await prisma.fornecedor.findFirst({
      where: {
        id,
        orgId: session.orgId,
      },
    })

    if (!fornecedor) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a tarifa existe e pertence ao fornecedor
    const existing = await prisma.fornecedorTarifa.findFirst({
      where: {
        id: tarifaId,
        fornecedorId: id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tarifa não encontrada' },
        { status: 404 }
      )
    }

    const { descricao, valor, moeda, unidade, vigenciaInicio, vigenciaFim, ativo, observacoes } = body

    const tarifa = await prisma.fornecedorTarifa.update({
      where: { id: tarifaId },
      data: {
        descricao: descricao !== undefined ? descricao : existing.descricao,
        valor: valor !== undefined ? valor : existing.valor,
        moeda: moeda !== undefined ? moeda : existing.moeda,
        unidade: unidade !== undefined ? unidade || null : existing.unidade,
        vigenciaInicio: vigenciaInicio !== undefined ? (vigenciaInicio ? new Date(vigenciaInicio) : null) : existing.vigenciaInicio,
        vigenciaFim: vigenciaFim !== undefined ? (vigenciaFim ? new Date(vigenciaFim) : null) : existing.vigenciaFim,
        ativo: ativo !== undefined ? ativo : existing.ativo,
        observacoes: observacoes !== undefined ? observacoes || null : existing.observacoes,
      },
    })

    return NextResponse.json({
      success: true,
      data: tarifa,
    })
  } catch (error: any) {
    console.error('Update tarifa error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar tarifa' },
      { status: 500 }
    )
  }
}

// DELETE /api/fornecedores/[id]/tarifas/[tarifaId] - Deletar tarifa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tarifaId: string } }
) {
  try {
    const session = await requireAuth()
    const { id, tarifaId } = params

    // Verificar se o fornecedor existe e pertence à organização
    const fornecedor = await prisma.fornecedor.findFirst({
      where: {
        id,
        orgId: session.orgId,
      },
    })

    if (!fornecedor) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a tarifa existe e pertence ao fornecedor
    const existing = await prisma.fornecedorTarifa.findFirst({
      where: {
        id: tarifaId,
        fornecedorId: id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tarifa não encontrada' },
        { status: 404 }
      )
    }

    await prisma.fornecedorTarifa.delete({
      where: { id: tarifaId },
    })

    return NextResponse.json({
      success: true,
      data: { id: tarifaId },
    })
  } catch (error: any) {
    console.error('Delete tarifa error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao deletar tarifa' },
      { status: 500 }
    )
  }
}
