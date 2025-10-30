import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createOSSchema, listOSQuerySchema } from '@/lib/validators/os'

// GET /api/os - Listar OS
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    // Validar query params
    const query = listOSQuerySchema.parse({
      status: searchParams.get('status'),
      agente: searchParams.get('agente'),
      destino: searchParams.get('destino'),
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })
    
    const skip = (query.page - 1) * query.limit
    
    // Construir filtros
    const where: any = {
      orgId: session.orgId,
    }
    
    if (query.status) {
      where.status = query.status
    }
    
    if (query.agente) {
      where.agenteResponsavelId = query.agente
    }
    
    if (query.destino) {
      where.destino = {
        contains: query.destino,
        mode: 'insensitive',
      }
    }
    
    if (query.dataInicio) {
      where.dataInicio = {
        gte: new Date(query.dataInicio),
      }
    }
    
    if (query.dataFim) {
      where.dataFim = {
        lte: new Date(query.dataFim),
      }
    }
    
    // Buscar OS
    const [os, total] = await Promise.all([
      prisma.oS.findMany({
        where,
        skip,
        take: query.limit,
        include: {
          agenteResponsavel: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          _count: {
            select: {
              participantes: true,
              atividades: true,
              hospedagens: true,
            },
          },
        },
        orderBy: {
          dataInicio: 'desc',
        },
      }),
      prisma.oS.count({ where }),
    ])
    
    return NextResponse.json({
      success: true,
      data: os,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error: any) {
    console.error('List OS error:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro ao listar OS' },
      { status: 500 }
    )
  }
}

// POST /api/os - Criar OS
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    
    // Validar entrada
    const validatedData = createOSSchema.parse(body)
    
    // Criar OS
    const os = await prisma.oS.create({
      data: {
        ...validatedData,
        orgId: session.orgId,
        dataInicio: new Date(validatedData.dataInicio),
        dataFim: new Date(validatedData.dataFim),
      },
      include: {
        agenteResponsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })
    
    // Criar histórico de status
    await prisma.historicoStatus.create({
      data: {
        osId: os.id,
        para: os.status,
        alteradoPor: session.userId,
        motivo: 'Criação da OS',
      },
    })
    
    return NextResponse.json(
      {
        success: true,
        data: os,
        message: 'OS criada com sucesso',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create OS error:', error)
    
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
      { success: false, error: 'Erro ao criar OS' },
      { status: 500 }
    )
  }
}
