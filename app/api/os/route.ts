import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createOSSchema, listOSQuerySchema } from '@/lib/validators/os'
import { logAuditoria } from '@/lib/services/auditoria'

// GET /api/os - Listar OS
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    console.log('[OS][GET] session', { orgId: session.orgId, userId: session.userId })
    console.log('[OS][GET] rawParams', {
      titulo: searchParams.get('titulo'),
      status: searchParams.get('status'),
      agente: searchParams.get('agente'),
      destino: searchParams.get('destino'),
      dataInicio: searchParams.get('dataInicio'),
      dataFim: searchParams.get('dataFim'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })
    
    // Validar query params
    const query = listOSQuerySchema.parse({
      titulo: searchParams.get('titulo') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      agente: searchParams.get('agente') ?? undefined,
      destino: searchParams.get('destino') ?? undefined,
      dataInicio: searchParams.get('dataInicio') ?? undefined,
      dataFim: searchParams.get('dataFim') ?? undefined,
      page: searchParams.get('page') ?? '1',
      limit: searchParams.get('limit') ?? '20',
    })
    console.log('[OS][GET] parsedQuery', query)
    
    const skip = (query.page - 1) * query.limit
    console.log('[OS][GET] pagination', { skip, take: query.limit })
    
    // Construir filtros
    const where: any = {
      orgId: session.orgId,
    }
    
    if (query.titulo) {
      where.titulo = {
        contains: query.titulo,
        mode: 'insensitive',
      }
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
    
    // Buscar total isoladamente para evitar OFFSET no COUNT
    console.log('[OS][GET] where', where)
    const total = await prisma.oS.count({ where: { ...where } })
    console.log('[OS][GET] total', total)

    // Buscar OS paginadas
    const os = await prisma.oS.findMany({
      where: { ...where },
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
            transportes: true,
          },
        },
      },
      orderBy: {
        dataInicio: 'desc',
      },
    })
    console.log('[OS][GET] resultCount', os.length)
    if (os.length) {
      console.log('[OS][GET] firstItems', os.slice(0, 3).map((o) => ({ id: o.id, titulo: o.titulo, dataInicio: o.dataInicio })))
    }
    
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
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
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

    // Registrar auditoria
    try {
      await logAuditoria({
        osId: os.id,
        usuarioId: session.userId,
        acao: 'criar',
        entidade: 'os',
        entidadeId: os.id,
        dadosNovos: os,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // Revalidar cache para atualizar a lista de OS
    revalidatePath('/dashboard/os')
    revalidatePath('/dashboard')

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
