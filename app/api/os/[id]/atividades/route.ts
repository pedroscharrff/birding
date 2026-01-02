import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createAtividadeSchema } from '@/lib/validators/atividade'
import { logAuditoria } from '@/lib/services/auditoria'

// POST /api/os/[id]/atividades - Adicionar atividade
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId } = params
    const body = await request.json()

    // Validar entrada
    const validatedData = createAtividadeSchema.parse({
      ...body,
      osId,
    })

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

    // Criar atividade
    const atividade = await prisma.atividade.create({
      data: {
        ...validatedData,
        ...(validatedData.data && {
          data: new Date(validatedData.data),
        }),
        ...(validatedData.valor && {
          valor: validatedData.valor,
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
        acao: 'criar',
        entidade: 'atividade',
        entidadeId: atividade.id,
        dadosNovos: atividade,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    return NextResponse.json(
      {
        success: true,
        data: atividade,
        message: 'Atividade adicionada com sucesso',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create atividade error:', error)

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
      { success: false, error: 'Erro ao adicionar atividade' },
      { status: 500 }
    )
  }
}
