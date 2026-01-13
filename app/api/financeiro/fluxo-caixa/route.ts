import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  getFluxoCaixaCache, 
  setFluxoCaixaCache 
} from '@/lib/cache/financeiro-cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/financeiro/fluxo-caixa - Fluxo de caixa mensal
 * Otimizado com cache
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const meses = parseInt(searchParams.get('meses') || '6')
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Tentar buscar do cache primeiro
    if (!forceRefresh) {
      const cached = await getFluxoCaixaCache(session.orgId, meses)
      if (cached) {
        return NextResponse.json({
          success: true,
          data: cached,
          cached: true
        })
      }
    }

    const hoje = new Date()
    const fluxoMensal = []

    for (let i = meses - 1; i >= 0; i--) {
      const mesReferencia = subMonths(hoje, i)
      const dataInicio = startOfMonth(mesReferencia)
      const dataFim = endOfMonth(mesReferencia)

      // Entradas (pagamentos recebidos)
      const entradas = await prisma.pagamentoOS.aggregate({
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

      // Saídas (pagamentos efetuados)
      const saidas = await prisma.pagamentoOS.aggregate({
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

      const totalEntradas = Number(entradas._sum.valor || 0) + Number(lancamentosEntrada._sum.valor || 0)
      const totalSaidas = Number(saidas._sum.valor || 0) + Number(lancamentosSaida._sum.valor || 0)
      const saldo = totalEntradas - totalSaidas

      fluxoMensal.push({
        mes: format(mesReferencia, 'MMM/yyyy', { locale: ptBR }),
        mesCompleto: format(mesReferencia, 'MMMM yyyy', { locale: ptBR }),
        dataInicio,
        dataFim,
        entradas: totalEntradas,
        saidas: totalSaidas,
        saldo
      })
    }

    // Salvar no cache
    await setFluxoCaixaCache(session.orgId, meses, fluxoMensal)

    return NextResponse.json({
      success: true,
      data: fluxoMensal,
      cached: false
    })
  } catch (error: any) {
    console.error('[Financeiro Fluxo Caixa] Erro:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar fluxo de caixa' },
      { status: 500 }
    )
  }
}
