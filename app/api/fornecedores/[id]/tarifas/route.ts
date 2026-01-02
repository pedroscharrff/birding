import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

// GET /api/fornecedores/[id]/tarifas - Listar tarifas do fornecedor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params
    const { searchParams } = new URL(request.url)
    const apenasAtivas = searchParams.get('ativas') === 'true'

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

    const where: any = { fornecedorId: id }
    
    if (apenasAtivas) {
      where.ativo = true
      where.OR = [
        { vigenciaFim: null },
        { vigenciaFim: { gte: new Date() } }
      ]
    }

    const tarifas = await prisma.fornecedorTarifa.findMany({
      where,
      orderBy: [
        { ativo: 'desc' },
        { vigenciaInicio: 'desc' },
        { descricao: 'asc' }
      ],
    })

    return NextResponse.json({
      success: true,
      data: tarifas,
    })
  } catch (error: any) {
    console.error('List tarifas error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao listar tarifas' },
      { status: 500 }
    )
  }
}

// POST /api/fornecedores/[id]/tarifas - Criar tarifa
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params
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

    const { descricao, valor, moeda, unidade, vigenciaInicio, vigenciaFim, observacoes } = body

    if (!descricao || !valor) {
      return NextResponse.json(
        { success: false, error: 'Descrição e valor são obrigatórios' },
        { status: 400 }
      )
    }

    const tarifa = await prisma.fornecedorTarifa.create({
      data: {
        fornecedorId: id,
        descricao,
        valor,
        moeda: moeda || 'BRL',
        unidade: unidade || null,
        vigenciaInicio: vigenciaInicio ? new Date(vigenciaInicio) : null,
        vigenciaFim: vigenciaFim ? new Date(vigenciaFim) : null,
        observacoes: observacoes || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: tarifa,
    })
  } catch (error: any) {
    console.error('Create tarifa error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao criar tarifa' },
      { status: 500 }
    )
  }
}
