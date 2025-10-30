import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createLancamentoSchema, listLancamentosQuerySchema } from '@/lib/validators/financeiro'

// GET /api/financeiro/lancamentos - Listar lançamentos
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    // Validar query params
    const query = listLancamentosQuerySchema.parse({
      osId: searchParams.get('osId'),
      categoria: searchParams.get('categoria'),
      tipo: searchParams.get('tipo'),
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    })
    
    const skip = (query.page - 1) * query.limit
    
    // Construir filtros
    const where: any = {
      orgId: session.orgId,
    }
    
    if (query.osId) {
      where.osId = query.osId
    }
    
    if (query.categoria) {
      where.categoria = query.categoria
    }
    
    if (query.tipo) {
      where.tipo = query.tipo
    }
    
    if (query.dataInicio || query.dataFim) {
      where.data = {}
      if (query.dataInicio) {
        where.data.gte = new Date(query.dataInicio)
      }
      if (query.dataFim) {
        where.data.lte = new Date(query.dataFim)
      }
    }
    
    // Buscar lançamentos
    const [lancamentos, total] = await Promise.all([
      prisma.lancamentoFinanceiro.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          os: {
            select: {
              id: true,
              titulo: true,
            },
          },
          referenciaUsuario: {
            select: {
              id: true,
              nome: true,
            },
          },
          fornecedor: {
            select: {
              id: true,
              nomeFantasia: true,
            },
          },
          criador: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          data: 'desc',
        },
      }),
      prisma.lancamentoFinanceiro.count({ where }),
    ])
    
    return NextResponse.json({
      success: true,
      data: lancamentos,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error: any) {
    console.error('List lancamentos error:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro ao listar lançamentos' },
      { status: 500 }
    )
  }
}

// POST /api/financeiro/lancamentos - Criar lançamento
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    
    // Validar entrada
    const validatedData = createLancamentoSchema.parse(body)
    
    // Se há osId, verificar se OS existe e pertence à organização
    if (validatedData.osId) {
      const os = await prisma.oS.findFirst({
        where: {
          id: validatedData.osId,
          orgId: session.orgId,
        },
      })
      
      if (!os) {
        return NextResponse.json(
          { success: false, error: 'OS não encontrada' },
          { status: 404 }
        )
      }
    }
    
    // Criar lançamento
    const lancamento = await prisma.lancamentoFinanceiro.create({
      data: {
        ...validatedData,
        orgId: session.orgId,
        createdBy: session.userId,
        data: new Date(validatedData.data),
      },
      include: {
        os: {
          select: {
            id: true,
            titulo: true,
          },
        },
        referenciaUsuario: {
          select: {
            id: true,
            nome: true,
          },
        },
        fornecedor: {
          select: {
            id: true,
            nomeFantasia: true,
          },
        },
      },
    })
    
    return NextResponse.json(
      {
        success: true,
        data: lancamento,
        message: 'Lançamento criado com sucesso',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create lancamento error:', error)
    
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
      { success: false, error: 'Erro ao criar lançamento' },
      { status: 500 }
    )
  }
}
