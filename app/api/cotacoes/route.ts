import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { Prisma } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { orgId, userId } = session

    const body = await req.json()
    const {
      titulo,
      clienteNome,
      clienteEmail,
      clienteTelefone,
      destino,
      dataInicio,
      dataFim,
      observacoesInternas,
      observacoesCliente,
      hospedagens = [],
      atividades = [],
      transportes = [],
      alimentacoes = [],
    } = body

    const totalHospedagens = hospedagens.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    const totalAtividades = atividades.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    const totalTransportes = transportes.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    const totalAlimentacoes = alimentacoes.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    const valorTotal = totalHospedagens + totalAtividades + totalTransportes + totalAlimentacoes

    const itensData: Prisma.CotacaoItemCreateWithoutCotacaoInput[] = [
      ...hospedagens.map((item: any) => ({
        categoria: "hospedagem" as const,
        fornecedorId: item.fornecedorId || undefined,
        tarifaId: item.tarifaId || undefined,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: new Prisma.Decimal(item.valorUnitario),
        moeda: item.moeda || "BRL",
        subtotal: new Prisma.Decimal(item.subtotal),
        observacoes: item.observacoes || undefined,
      })),
      ...atividades.map((item: any) => ({
        categoria: "atividade" as const,
        fornecedorId: item.fornecedorId || undefined,
        tarifaId: item.tarifaId || undefined,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: new Prisma.Decimal(item.valorUnitario),
        moeda: item.moeda || "BRL",
        subtotal: new Prisma.Decimal(item.subtotal),
        observacoes: item.observacoes || undefined,
      })),
      ...transportes.map((item: any) => ({
        categoria: "transporte" as const,
        fornecedorId: item.fornecedorId || undefined,
        tarifaId: item.tarifaId || undefined,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: new Prisma.Decimal(item.valorUnitario),
        moeda: item.moeda || "BRL",
        subtotal: new Prisma.Decimal(item.subtotal),
        observacoes: item.observacoes || undefined,
      })),
      ...alimentacoes.map((item: any) => ({
        categoria: "alimentacao" as const,
        fornecedorId: item.fornecedorId || undefined,
        tarifaId: item.tarifaId || undefined,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: new Prisma.Decimal(item.valorUnitario),
        moeda: item.moeda || "BRL",
        subtotal: new Prisma.Decimal(item.subtotal),
        observacoes: item.observacoes || undefined,
      })),
    ]

    const cotacao = await prisma.cotacao.create({
      data: {
        organizacao: {
          connect: { id: orgId }
        },
        responsavel: {
          connect: { id: userId }
        },
        titulo,
        clienteNome,
        clienteEmail: clienteEmail || undefined,
        clienteTelefone: clienteTelefone || undefined,
        destino,
        dataInicio: dataInicio ? new Date(dataInicio) : undefined,
        dataFim: dataFim ? new Date(dataFim) : undefined,
        observacoesInternas: observacoesInternas || undefined,
        observacoesCliente: observacoesCliente || undefined,
        valorTotal: new Prisma.Decimal(valorTotal),
        moeda: "BRL",
        statusCotacao: "rascunho",
        itens: {
          create: itensData
        }
      },
      include: {
        itens: {
          include: {
            fornecedor: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      cotacao,
      message: "Cotação criada com sucesso"
    })
  } catch (error: any) {
    console.error("Erro ao criar cotação:", error)
    return NextResponse.json(
      { 
        error: "Erro ao criar cotação",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { orgId } = session
    const { searchParams } = new URL(req.url)

    const status = searchParams.get("status")
    const destino = searchParams.get("destino")
    const responsavel = searchParams.get("responsavel")

    const where: any = {
      orgId
    }

    if (status && status !== "todos") {
      where.statusCotacao = status
    }

    if (destino) {
      where.destino = {
        contains: destino,
        mode: "insensitive"
      }
    }

    if (responsavel && responsavel !== "todos") {
      where.responsavelId = responsavel
    }

    const cotacoes = await prisma.cotacao.findMany({
      where,
      include: {
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        itens: {
          include: {
            fornecedor: {
              select: {
                id: true,
                nomeFantasia: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      success: true,
      cotacoes
    })
  } catch (error: any) {
    console.error("Erro ao listar cotações:", error)
    return NextResponse.json(
      { 
        error: "Erro ao listar cotações",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
