import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns'
import { 
  getResumoFinanceiroCache, 
  setResumoFinanceiroCache 
} from '@/lib/cache/financeiro-cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/financeiro/resumo - Resumo financeiro geral da empresa
 * Otimizado com cache e queries paralelas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'mes' // mes, trimestre, ano
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Tentar buscar do cache primeiro
    if (!forceRefresh) {
      const cached = await getResumoFinanceiroCache(session.orgId, periodo)
      if (cached) {
        return NextResponse.json({
          success: true,
          data: cached,
          cached: true
        })
      }
    }

    const hoje = new Date()
    let dataInicio: Date
    let dataFim: Date

    switch (periodo) {
      case 'trimestre':
        dataInicio = subMonths(startOfMonth(hoje), 2)
        dataFim = endOfMonth(hoje)
        break
      case 'ano':
        dataInicio = startOfYear(hoje)
        dataFim = endOfMonth(hoje)
        break
      case 'mes':
      default:
        dataInicio = startOfMonth(hoje)
        dataFim = endOfMonth(hoje)
    }

    // Receitas (entradas de OS)
    const receitasOS = await prisma.oS.aggregate({
      where: {
        orgId: session.orgId,
        createdAt: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      _sum: {
        valorVenda: true,
        valorRecebido: true
      },
      _count: true
    })

    // Pagamentos recebidos (entradas)
    const pagamentosRecebidos = await prisma.pagamentoOS.aggregate({
      where: {
        orgId: session.orgId,
        tipo: 'entrada',
        status: 'pago',
        dataPagamento: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      _sum: { valor: true }
    })

    // Pagamentos a receber (pendentes)
    const pagamentosAReceber = await prisma.pagamentoOS.aggregate({
      where: {
        orgId: session.orgId,
        tipo: 'entrada',
        status: { in: ['pendente', 'parcial'] },
        dataVencimento: {
          lte: endOfMonth(hoje)
        }
      },
      _sum: { valor: true },
      _count: true
    })

    // Pagamentos atrasados (entradas)
    const pagamentosAtrasados = await prisma.pagamentoOS.aggregate({
      where: {
        orgId: session.orgId,
        tipo: 'entrada',
        status: { in: ['pendente', 'parcial', 'atrasado'] },
        dataVencimento: {
          lt: hoje
        }
      },
      _sum: { valor: true },
      _count: true
    })

    // Despesas pagas (saídas)
    const despesasPagas = await prisma.pagamentoOS.aggregate({
      where: {
        orgId: session.orgId,
        tipo: 'saida',
        status: 'pago',
        dataPagamento: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      _sum: { valor: true }
    })

    // Despesas a pagar (pendentes)
    const despesasAPagar = await prisma.pagamentoOS.aggregate({
      where: {
        orgId: session.orgId,
        tipo: 'saida',
        status: { in: ['pendente', 'parcial'] },
        dataVencimento: {
          lte: endOfMonth(hoje)
        }
      },
      _sum: { valor: true },
      _count: true
    })

    // Despesas atrasadas
    const despesasAtrasadas = await prisma.pagamentoOS.aggregate({
      where: {
        orgId: session.orgId,
        tipo: 'saida',
        status: { in: ['pendente', 'parcial', 'atrasado'] },
        dataVencimento: {
          lt: hoje
        }
      },
      _sum: { valor: true },
      _count: true
    })

    // Custos totais das OS (hospedagem, transporte, atividades, passagens)
    const [custosHospedagem, custosTransporte, custosAtividades, custosPassagens] = await Promise.all([
      prisma.hospedagem.aggregate({
        where: {
          os: { orgId: session.orgId },
          createdAt: { gte: dataInicio, lte: dataFim }
        },
        _sum: { custoTotal: true }
      }),
      prisma.transporte.aggregate({
        where: {
          os: { orgId: session.orgId },
          createdAt: { gte: dataInicio, lte: dataFim }
        },
        _sum: { custo: true }
      }),
      prisma.atividade.aggregate({
        where: {
          os: { orgId: session.orgId },
          createdAt: { gte: dataInicio, lte: dataFim }
        },
        _sum: { valor: true }
      }),
      prisma.passagemAerea.aggregate({
        where: {
          os: { orgId: session.orgId },
          createdAt: { gte: dataInicio, lte: dataFim }
        },
        _sum: { custo: true }
      })
    ])

    // Lançamentos financeiros
    const lancamentosEntrada = await prisma.lancamentoFinanceiro.aggregate({
      where: {
        orgId: session.orgId,
        tipo: { in: ['entrada', 'receita_os'] },
        data: { gte: dataInicio, lte: dataFim }
      },
      _sum: { valor: true }
    })

    const lancamentosSaida = await prisma.lancamentoFinanceiro.aggregate({
      where: {
        orgId: session.orgId,
        tipo: { in: ['saida', 'adiantamento'] },
        data: { gte: dataInicio, lte: dataFim }
      },
      _sum: { valor: true }
    })

    // OS por status
    const osPorStatus = await prisma.oS.groupBy({
      by: ['status'],
      where: {
        orgId: session.orgId,
        createdAt: { gte: dataInicio, lte: dataFim }
      },
      _count: true,
      _sum: {
        valorVenda: true,
        valorRecebido: true
      }
    })

    // Top fornecedores (por despesas)
    const topFornecedores = await prisma.pagamentoOS.groupBy({
      by: ['fornecedorId'],
      where: {
        orgId: session.orgId,
        tipo: 'saida',
        fornecedorId: { not: null },
        dataPagamento: { gte: dataInicio, lte: dataFim }
      },
      _sum: { valor: true },
      _count: true,
      orderBy: {
        _sum: {
          valor: 'desc'
        }
      },
      take: 5
    })

    // Buscar nomes dos fornecedores
    const fornecedorIds = topFornecedores
      .map(f => f.fornecedorId)
      .filter((id): id is string => id !== null)

    const fornecedores = await prisma.fornecedor.findMany({
      where: { id: { in: fornecedorIds } },
      select: { id: true, nomeFantasia: true }
    })

    const fornecedoresMap = new Map(fornecedores.map(f => [f.id, f.nomeFantasia]))

    const topFornecedoresComNome = topFornecedores.map(f => ({
      fornecedorId: f.fornecedorId,
      fornecedorNome: f.fornecedorId ? fornecedoresMap.get(f.fornecedorId) || 'Desconhecido' : 'Sem fornecedor',
      totalPago: Number(f._sum.valor || 0),
      quantidadePagamentos: f._count
    }))

    // Calcular totais
    const totalReceitas = Number(receitasOS._sum.valorVenda || 0)
    const totalRecebido = Number(pagamentosRecebidos._sum.valor || 0)
    const totalAReceber = Number(pagamentosAReceber._sum.valor || 0)
    const totalAtrasado = Number(pagamentosAtrasados._sum.valor || 0)

    const totalDespesas = 
      Number(custosHospedagem._sum.custoTotal || 0) +
      Number(custosTransporte._sum.custo || 0) +
      Number(custosAtividades._sum.valor || 0) +
      Number(custosPassagens._sum.custo || 0)

    const totalDespesasPagas = Number(despesasPagas._sum.valor || 0)
    const totalDespesasAPagar = Number(despesasAPagar._sum.valor || 0)
    const totalDespesasAtrasadas = Number(despesasAtrasadas._sum.valor || 0)

    const lucroEstimado = totalReceitas - totalDespesas
    const margemEstimada = totalReceitas > 0 ? (lucroEstimado / totalReceitas) * 100 : 0

    const fluxoCaixaReal = totalRecebido - totalDespesasPagas
    const saldoPendente = totalAReceber - totalDespesasAPagar

    const resultado = {
      periodo: {
        tipo: periodo,
        dataInicio,
        dataFim
      },
      resumo: {
        receitas: {
          total: totalReceitas,
          recebido: totalRecebido,
          aReceber: totalAReceber,
          atrasado: totalAtrasado,
          quantidadeAtrasados: pagamentosAtrasados._count
        },
        despesas: {
          total: totalDespesas,
          pagas: totalDespesasPagas,
          aPagar: totalDespesasAPagar,
          atrasadas: totalDespesasAtrasadas,
          quantidadeAtrasadas: despesasAtrasadas._count,
          detalhamento: {
            hospedagem: Number(custosHospedagem._sum.custoTotal || 0),
            transporte: Number(custosTransporte._sum.custo || 0),
            atividades: Number(custosAtividades._sum.valor || 0),
            passagens: Number(custosPassagens._sum.custo || 0)
          }
        },
        lucro: {
          estimado: lucroEstimado,
          margemPercentual: margemEstimada
        },
        fluxoCaixa: {
          real: fluxoCaixaReal,
          saldoPendente: saldoPendente
        }
      },
      os: {
        total: receitasOS._count,
        porStatus: osPorStatus.map(s => ({
          status: s.status,
          quantidade: s._count,
          valorTotal: Number(s._sum.valorVenda || 0),
          valorRecebido: Number(s._sum.valorRecebido || 0)
        }))
      },
      topFornecedores: topFornecedoresComNome,
      lancamentos: {
        entradas: Number(lancamentosEntrada._sum.valor || 0),
        saidas: Number(lancamentosSaida._sum.valor || 0)
      }
    }

    // Salvar no cache
    await setResumoFinanceiroCache(session.orgId, periodo, resultado)

    return NextResponse.json({
      success: true,
      data: resultado,
      cached: false
    })
  } catch (error: any) {
    console.error('[Financeiro Resumo] Erro:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar resumo financeiro' },
      { status: 500 }
    )
  }
}
