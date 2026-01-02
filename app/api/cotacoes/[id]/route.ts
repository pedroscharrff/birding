import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { Prisma } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { orgId } = session

    const cotacao = await prisma.cotacao.findFirst({
      where: {
        id: params.id,
        orgId
      },
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
                nomeFantasia: true,
                tipo: true
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    })

    if (!cotacao) {
      return NextResponse.json(
        { error: "Cotação não encontrada" },
        { status: 404 }
      )
    }

    const hospedagens = cotacao.itens
      .filter(item => item.categoria === "hospedagem")
      .map(item => ({
        id: item.id,
        fornecedorId: item.fornecedorId,
        tarifaId: item.tarifaId,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: Number(item.valorUnitario),
        moeda: item.moeda,
        subtotal: Number(item.subtotal),
        observacoes: item.observacoes
      }))

    const atividades = cotacao.itens
      .filter(item => item.categoria === "atividade")
      .map(item => ({
        id: item.id,
        fornecedorId: item.fornecedorId,
        tarifaId: item.tarifaId,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: Number(item.valorUnitario),
        moeda: item.moeda,
        subtotal: Number(item.subtotal),
        observacoes: item.observacoes
      }))

    const transportes = cotacao.itens
      .filter(item => item.categoria === "transporte")
      .map(item => ({
        id: item.id,
        fornecedorId: item.fornecedorId,
        tarifaId: item.tarifaId,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: Number(item.valorUnitario),
        moeda: item.moeda,
        subtotal: Number(item.subtotal),
        observacoes: item.observacoes
      }))

    const alimentacoes = cotacao.itens
      .filter(item => item.categoria === "alimentacao")
      .map(item => ({
        id: item.id,
        fornecedorId: item.fornecedorId,
        tarifaId: item.tarifaId,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: Number(item.valorUnitario),
        moeda: item.moeda,
        subtotal: Number(item.subtotal),
        observacoes: item.observacoes
      }))

    return NextResponse.json({
      success: true,
      cotacao: {
        id: cotacao.id,
        titulo: cotacao.titulo,
        clienteNome: cotacao.clienteNome,
        clienteEmail: cotacao.clienteEmail,
        clienteTelefone: cotacao.clienteTelefone,
        destino: cotacao.destino,
        dataInicio: cotacao.dataInicio?.toISOString().split('T')[0],
        dataFim: cotacao.dataFim?.toISOString().split('T')[0],
        statusCotacao: cotacao.statusCotacao,
        observacoesInternas: cotacao.observacoesInternas,
        observacoesCliente: cotacao.observacoesCliente,
        responsavel: cotacao.responsavel.nome,
        createdAt: cotacao.createdAt.toISOString().split('T')[0],
        hospedagens,
        atividades,
        transportes,
        alimentacoes
      }
    })
  } catch (error: any) {
    console.error("Erro ao buscar cotação:", error)
    return NextResponse.json(
      { 
        error: "Erro ao buscar cotação",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { orgId } = session

    const body = await req.json()
    const {
      titulo,
      clienteNome,
      clienteEmail,
      clienteTelefone,
      destino,
      dataInicio,
      dataFim,
      statusCotacao,
      observacoesInternas,
      observacoesCliente,
      hospedagens = [],
      atividades = [],
      transportes = [],
      alimentacoes = [],
    } = body

    const cotacaoExistente = await prisma.cotacao.findFirst({
      where: {
        id: params.id,
        orgId
      }
    })

    if (!cotacaoExistente) {
      return NextResponse.json(
        { error: "Cotação não encontrada" },
        { status: 404 }
      )
    }

    const totalHospedagens = hospedagens.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    const totalAtividades = atividades.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    const totalTransportes = transportes.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    const totalAlimentacoes = alimentacoes.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
    const valorTotal = totalHospedagens + totalAtividades + totalTransportes + totalAlimentacoes

    await prisma.cotacaoItem.deleteMany({
      where: {
        cotacaoId: params.id
      }
    })

    const itensData = [
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

    const cotacao = await prisma.cotacao.update({
      where: {
        id: params.id
      },
      data: {
        titulo,
        clienteNome,
        clienteEmail: clienteEmail || undefined,
        clienteTelefone: clienteTelefone || undefined,
        destino,
        dataInicio: dataInicio ? new Date(dataInicio) : undefined,
        dataFim: dataFim ? new Date(dataFim) : undefined,
        statusCotacao: statusCotacao || "rascunho",
        observacoesInternas: observacoesInternas || undefined,
        observacoesCliente: observacoesCliente || undefined,
        valorTotal: new Prisma.Decimal(valorTotal),
        itens: {
          create: itensData
        }
      },
      include: {
        itens: {
          include: {
            fornecedor: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      cotacao,
      message: "Cotação atualizada com sucesso"
    })
  } catch (error: any) {
    console.error("Erro ao atualizar cotação:", error)
    return NextResponse.json(
      { 
        error: "Erro ao atualizar cotação",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
