import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { z } from 'zod'
import { parseLocalDate } from '@/lib/utils/date'

const updateExtensionSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  descricao: z.string().optional(),
  status: z.string().optional(),
  // Campos Financeiros
  valorVenda: z.number().optional(),
  moedaVenda: z.string().optional(),
  valorRecebido: z.number().optional(),
  custoEstimado: z.number().optional(),
  custoReal: z.number().optional(),
  margemEstimada: z.number().optional(),
  obsFinanceiras: z.string().optional(),
})

const patchExtensionSchema = z.object({
  status: z.string(),
  motivo: z.string().optional(),
})

// GET /api/os/[id]/extensoes/[extensaoId] - Obter dados completos de uma extensão
export async function GET(
  request: Request,
  { params }: { params: { id: string, extensaoId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: osId, extensaoId } = params

    const extensao = await prisma.oSExtensao.findFirst({
      where: {
        id: extensaoId,
        osId: osId,
      },
      include: {
        participantes: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            passaporteNumero: true,
            passaporteValidade: true,
            alergias: true,
            restricoes: true,
            preferencias: true,
            idade: true,
            observacoes: true,
            documentos: true,
          },
          orderBy: { nome: 'asc' },
        },
        atividades: {
          include: {
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true,
                tipo: true,
              },
            },
          },
          orderBy: [{ data: 'asc' }, { hora: 'asc' }],
        },
        hospedagens: {
          include: {
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true,
                tipo: true,
                email: true,
                telefone: true,
              },
            },
          },
          orderBy: { checkin: 'asc' },
        },
        transportes: {
          include: {
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true,
                tipo: true,
              },
            },
          },
          orderBy: { dataPartida: 'asc' },
        },
        passagensAereas: {
          orderBy: { dataPartida: 'asc' },
        },
        guias: {
          include: {
            guia: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
              },
            },
          },
        },
        motoristas: {
          include: {
            motorista: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
              },
            },
          },
        },
        fornecedores: {
          include: {
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true,
                tipo: true,
                email: true,
                telefone: true,
              },
            },
          },
        },
        historicoStatus: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!extensao) {
      return NextResponse.json({ error: 'Extensão não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: extensao })
  } catch (error) {
    console.error('Erro ao buscar extensão:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar extensão' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string, extensaoId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: osId, extensaoId } = params
    const body = await request.json()
    const data = updateExtensionSchema.parse(body)

    // Buscar extensão atual para ver status anterior
    const currentExtension = await prisma.oSExtensao.findUnique({
      where: { id: extensaoId }
    })

    if (!currentExtension) {
      return NextResponse.json({ error: 'Extensão não encontrada' }, { status: 404 })
    }

    const extensao = await prisma.oSExtensao.update({
      where: {
        id: extensaoId
      },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.dataInicio && { dataInicio: parseLocalDate(data.dataInicio) }),
        ...(data.dataFim && { dataFim: parseLocalDate(data.dataFim) }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.status && { status: data.status as any }),
        // Campos Financeiros
        ...(data.valorVenda !== undefined && { valorVenda: data.valorVenda }),
        ...(data.moedaVenda && { moedaVenda: data.moedaVenda as any }),
        ...(data.valorRecebido !== undefined && { valorRecebido: data.valorRecebido }),
        ...(data.custoEstimado !== undefined && { custoEstimado: data.custoEstimado }),
        ...(data.custoReal !== undefined && { custoReal: data.custoReal }),
        ...(data.margemEstimada !== undefined && { margemEstimada: data.margemEstimada }),
        ...(data.obsFinanceiras !== undefined && { obsFinanceiras: data.obsFinanceiras }),
      }
    })

    // Registrar histórico de status se mudou
    if (data.status && currentExtension.status !== (data.status as any)) {
      await prisma.historicoStatus.create({
        data: {
          osId,
          extensaoId: extensao.id,
          de: currentExtension.status,
          para: data.status as any,
          alteradoPor: session.userId,
          motivo: 'Alterado via edição de extensão'
        }
      })
    }

    await prisma.auditoriaOS.create({
      data: {
        orgId: session.orgId,
        osId,
        usuarioId: session.userId,
        usuarioNome: 'Usuário',
        usuarioRole: session.roleGlobal as any,
        acao: 'atualizar',
        entidade: 'extensao',
        entidadeId: extensao.id,
        dadosNovos: extensao as any,
        descricao: `Atualizou extensão: ${extensao.nome}`
      }
    })

    return NextResponse.json(extensao)
  } catch (error) {
    console.error('Erro ao atualizar extensão:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar extensão' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string, extensaoId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: osId, extensaoId } = params
    const body = await request.json()
    const data = patchExtensionSchema.parse(body)

    // Buscar extensão atual
    const currentExtension = await prisma.oSExtensao.findUnique({
      where: { id: extensaoId }
    })

    if (!currentExtension) {
      return NextResponse.json({ error: 'Extensão não encontrada' }, { status: 404 })
    }

    // Se status for igual, retorna
    if (currentExtension.status === (data.status as any)) {
      return NextResponse.json(currentExtension)
    }

    // Atualiza
    const extensao = await prisma.oSExtensao.update({
      where: { id: extensaoId },
      data: {
        status: data.status as any
      }
    })

    // Histórico
    await prisma.historicoStatus.create({
      data: {
        osId,
        extensaoId: extensao.id,
        de: currentExtension.status,
        para: data.status as any,
        alteradoPor: session.userId,
        motivo: data.motivo || 'Alteração rápida de status'
      }
    })

    // Auditoria
    await prisma.auditoriaOS.create({
      data: {
        orgId: session.orgId,
        osId,
        usuarioId: session.userId,
        usuarioNome: 'Usuário',
        usuarioRole: session.roleGlobal as any,
        acao: 'atualizar',
        entidade: 'extensao',
        entidadeId: extensao.id,
        dadosNovos: { status: data.status } as any,
        descricao: `Alterou status da extensão: ${currentExtension.status} -> ${data.status}`
      }
    })

    return NextResponse.json(extensao)

  } catch (error) {
    console.error('Erro ao atualizar status da extensão:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar status da extensão' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, extensaoId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { id: osId, extensaoId } = params

    const extensao = await prisma.oSExtensao.delete({
      where: {
        id: extensaoId,
      }
    })

    await prisma.auditoriaOS.create({
      data: {
        orgId: session.orgId,
        osId,
        usuarioId: session.userId,
        usuarioNome: 'Usuário',
        usuarioRole: session.roleGlobal as any,
        acao: 'excluir',
        entidade: 'extensao',
        entidadeId: extensaoId,
        descricao: `Excluiu extensão ID: ${extensaoId}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir extensão:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir extensão' },
      { status: 500 }
    )
  }
}
