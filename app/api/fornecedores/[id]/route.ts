import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

// GET /api/fornecedores/[id] - Buscar fornecedor específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params

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

    return NextResponse.json({
      success: true,
      data: fornecedor,
    })
  } catch (error: any) {
    console.error('Get fornecedor error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar fornecedor' },
      { status: 500 }
    )
  }
}

// PATCH /api/fornecedores/[id] - Atualizar fornecedor
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params
    const body = await request.json()

    // Verificar se o fornecedor existe e pertence à organização
    const existing = await prisma.fornecedor.findFirst({
      where: {
        id,
        orgId: session.orgId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor não encontrado' },
        { status: 404 }
      )
    }

    const { nomeFantasia, razaoSocial, tipo, email, telefone, documento, endereco, obs } = body

    const fornecedor = await prisma.fornecedor.update({
      where: { id },
      data: {
        nomeFantasia: nomeFantasia !== undefined ? nomeFantasia : existing.nomeFantasia,
        razaoSocial: razaoSocial !== undefined ? razaoSocial || null : existing.razaoSocial,
        tipo: tipo !== undefined ? tipo : existing.tipo,
        email: email !== undefined ? email || null : existing.email,
        telefone: telefone !== undefined ? telefone || null : existing.telefone,
        documento: documento !== undefined ? documento || null : existing.documento,
        endereco: endereco !== undefined ? endereco || null : existing.endereco,
        obs: obs !== undefined ? obs || null : existing.obs,
      },
    })

    return NextResponse.json({
      success: true,
      data: fornecedor,
    })
  } catch (error: any) {
    console.error('Update fornecedor error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar fornecedor' },
      { status: 500 }
    )
  }
}

// DELETE /api/fornecedores/[id] - Deletar fornecedor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params

    // Verificar se o fornecedor existe e pertence à organização
    const existing = await prisma.fornecedor.findFirst({
      where: {
        id,
        orgId: session.orgId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há dependências (OSFornecedor, Atividades, etc.)
    const [osFornecedores, atividades, hospedagens, transportes] = await Promise.all([
      prisma.oSFornecedor.count({ where: { fornecedorId: id } }),
      prisma.atividade.count({ where: { fornecedorId: id } }),
      prisma.hospedagem.count({ where: { fornecedorId: id } }),
      prisma.transporte.count({ where: { fornecedorId: id } }),
    ])

    const totalDependencies = osFornecedores + atividades + hospedagens + transportes

    if (totalDependencies > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Não é possível excluir este fornecedor pois ele está vinculado a ${totalDependencies} registro(s)` 
        },
        { status: 400 }
      )
    }

    await prisma.fornecedor.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      data: { id },
    })
  } catch (error: any) {
    console.error('Delete fornecedor error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao deletar fornecedor' },
      { status: 500 }
    )
  }
}
