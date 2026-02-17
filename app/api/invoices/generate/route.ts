import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// POST /api/invoices/generate - Generate invoice from OS or Cotação
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const {
      osId,
      cotacaoId,
      titulo,
      descricao,
      clienteNome,
      clienteEmail,
      clienteTelefone,
      clienteDocumento,
      clienteEndereco,
      dataEmissao,
      dataVencimento,
      contaPagamentoId,
      itensIncluidos, // { hospedagens: [], atividades: [], transportes: [], alimentacoes: [], passagens: [] }
      observacoes,
      termosCondicoes,
    } = body

    // Validar que pelo menos osId ou cotacaoId foi fornecido
    if (!osId && !cotacaoId) {
      return NextResponse.json(
        { error: 'É necessário fornecer osId ou cotacaoId' },
        { status: 400 }
      )
    }

    // Buscar dados da OS ou Cotação para calcular valor total
    let valorTotal = 0
    let dadosOrigem: any = null

    if (osId) {
      dadosOrigem = await prisma.oS.findFirst({
        where: {
          id: osId,
          orgId: session.orgId,
        },
        include: {
          hospedagens: true,
          atividades: true,
          transportes: true,
          passagensAereas: true,
        },
      })

      if (!dadosOrigem) {
        return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 })
      }

      // Calcular valor total baseado nos itens selecionados
      if (itensIncluidos.hospedagens) {
        const hospedagensSelecionadas = dadosOrigem.hospedagens.filter((h: any) =>
          itensIncluidos.hospedagens.includes(h.id)
        )
        valorTotal += hospedagensSelecionadas.reduce(
          (sum: number, h: any) => sum + Number(h.custoTotal || 0),
          0
        )
      }

      if (itensIncluidos.atividades) {
        const atividadesSelecionadas = dadosOrigem.atividades.filter((a: any) =>
          itensIncluidos.atividades.includes(a.id)
        )
        valorTotal += atividadesSelecionadas.reduce(
          (sum: number, a: any) => sum + Number(a.valor || 0),
          0
        )
      }

      if (itensIncluidos.transportes) {
        const transportesSelecionados = dadosOrigem.transportes.filter((t: any) =>
          itensIncluidos.transportes.includes(t.id)
        )
        valorTotal += transportesSelecionados.reduce(
          (sum: number, t: any) => sum + Number(t.custo || 0),
          0
        )
      }

      if (itensIncluidos.passagens) {
        const passagensSelecionadas = dadosOrigem.passagensAereas.filter((p: any) =>
          itensIncluidos.passagens.includes(p.id)
        )
        valorTotal += passagensSelecionadas.reduce(
          (sum: number, p: any) => sum + Number(p.custo || 0),
          0
        )
      }
    } else if (cotacaoId) {
      dadosOrigem = await prisma.cotacao.findFirst({
        where: {
          id: cotacaoId,
          orgId: session.orgId,
        },
        include: {
          itens: true,
        },
      })

      if (!dadosOrigem) {
        return NextResponse.json({ error: 'Cotação não encontrada' }, { status: 404 })
      }

      // Para cotações, calcular baseado nos itens selecionados
      if (itensIncluidos.itens) {
        const itensSelecionados = dadosOrigem.itens.filter((item: any) =>
          itensIncluidos.itens.includes(item.id)
        )
        valorTotal = itensSelecionados.reduce(
          (sum: number, item: any) => sum + Number(item.subtotal || 0),
          0
        )
      }
    }

    // Gerar número sequencial do invoice
    const ultimoInvoice = await prisma.invoice.findFirst({
      where: { orgId: session.orgId },
      orderBy: { createdAt: 'desc' },
      select: { numero: true },
    })

    const proximoNumero = ultimoInvoice
      ? String(Number(ultimoInvoice.numero) + 1).padStart(6, '0')
      : '000001'

    // Criar invoice
    const invoice = await prisma.invoice.create({
      data: {
        orgId: session.orgId,
        numero: proximoNumero,
        osId,
        cotacaoId,
        titulo,
        descricao,
        clienteNome,
        clienteEmail,
        clienteTelefone,
        clienteDocumento,
        clienteEndereco,
        dataEmissao: new Date(dataEmissao),
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        valorTotal,
        moeda: dadosOrigem?.moedaVenda || dadosOrigem?.moeda || 'BRL',
        contaPagamentoId,
        itensIncluidos,
        observacoes,
        termosCondicoes,
        createdBy: session.userId,
      },
      include: {
        contaPagamento: true,
        os: {
          select: {
            titulo: true,
            destino: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao gerar invoice:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao gerar invoice', details: error.message },
      { status: 500 }
    )
  }
}
