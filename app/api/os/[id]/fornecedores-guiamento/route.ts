import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { logAuditoria } from '@/lib/services/auditoria'
import { alertsCache } from '@/lib/cache/alerts-cache'

// GET /api/os/[id]/fornecedores-guiamento - Listar fornecedores de guiamento vinculados à OS
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId } = params

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

    const { searchParams } = new URL(request.url)
    const extensaoId = searchParams.get('extensaoId')

    const where: any = {
      osId,
      categoria: 'guiamento',
    }

    if (extensaoId) {
      where.extensaoId = extensaoId
    } else {
      // Se não tem extensaoId na query, talvez queira pegar SÓ os do tour (extensaoId: null)
      // OU todos. O comportamento padrão do frontend parece ser "pegar específicos" quando tem ID.
      // Se não tem ID (Visão Geral), o frontend filtra depois?
      // No OSGuiasSection, se extensaoId for null, ele não manda query param.
      // E queremos ver APENAS os do tour principal nesses casos?
      // Sim, baseado na lógica de isolamento.
      where.extensaoId = null
    }

    // Buscar fornecedores de guiamento vinculados
    const fornecedores = await prisma.oSFornecedor.findMany({
      where,
      include: {
        fornecedor: {
          select: {
            id: true,
            nomeFantasia: true,
            razaoSocial: true,
            tipo: true,
            email: true,
            telefone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: fornecedores,
    })
  } catch (error: any) {
    console.error('Get fornecedores guiamento error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar fornecedores de guiamento' },
      { status: 500 }
    )
  }
}

// POST /api/os/[id]/fornecedores-guiamento - Adicionar fornecedor de guiamento à OS
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId } = params
    const body = await request.json()

    const { fornecedorId, contatoNome, contatoEmail, contatoTelefone, contratoRef, extensaoId } = body

    if (!fornecedorId) {
      return NextResponse.json(
        { success: false, error: 'fornecedorId é obrigatório' },
        { status: 400 }
      )
    }

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

    // Verificar se fornecedor existe, pertence à organização e é do tipo guiamento
    const fornecedor = await prisma.fornecedor.findFirst({
      where: {
        id: fornecedorId,
        orgId: session.orgId,
        tipo: 'guiamento',
      },
    })

    if (!fornecedor) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor de guiamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se fornecedor já está vinculado
    const existente = await prisma.oSFornecedor.findFirst({
      where: {
        osId,
        fornecedorId,
        categoria: 'guiamento',
        extensaoId: extensaoId || null,
      },
    })

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor já está vinculado a esta OS' },
        { status: 400 }
      )
    }

    // Criar vínculo
    const vinculo = await prisma.oSFornecedor.create({
      data: {
        osId,
        fornecedorId,
        categoria: 'guiamento',
        contatoNome: contatoNome || null,
        contatoEmail: contatoEmail || null,
        contatoTelefone: contatoTelefone || null,
        contratoRef: contratoRef || null,
        extensaoId: extensaoId || null,
      },
      include: {
        fornecedor: {
          select: {
            id: true,
            nomeFantasia: true,
            razaoSocial: true,
            tipo: true,
            email: true,
            telefone: true,
          },
        },
      },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'criar',
        entidade: 'fornecedor_os',
        entidadeId: vinculo.id,
        dadosNovos: {
          fornecedorId: vinculo.fornecedorId,
          fornecedorNome: fornecedor.nomeFantasia,
          categoria: 'guiamento',
          contatoNome: vinculo.contatoNome,
          contatoEmail: vinculo.contatoEmail,
          contatoTelefone: vinculo.contatoTelefone,
        },
        descricao: `Fornecedor de guiamento ${fornecedor.nomeFantasia} vinculado à OS`,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // Invalidar cache de alertas
    alertsCache.invalidate(session.orgId)
    console.log('[Cache] Cache de alertas invalidado após adicionar fornecedor de guiamento')

    return NextResponse.json(
      {
        success: true,
        data: vinculo,
        message: 'Fornecedor de guiamento adicionado com sucesso',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create fornecedor guiamento error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao adicionar fornecedor de guiamento' },
      { status: 500 }
    )
  }
}
