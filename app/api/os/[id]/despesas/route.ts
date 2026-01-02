import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { buscarDespesasConsolidadas, resumoPagamentosPorFornecedor } from '@/lib/services/despesas'

/**
 * GET /api/os/[id]/despesas - Listar todas as despesas consolidadas da OS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const osId = params.id
    const { searchParams } = new URL(request.url)
    const agruparPorFornecedor = searchParams.get('agruparPorFornecedor') === 'true'

    // Verificar se a OS existe e pertence à organização
    const os = await prisma.oS.findFirst({
      where: {
        id: osId,
        orgId: session.orgId
      }
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    if (agruparPorFornecedor) {
      const resumo = await resumoPagamentosPorFornecedor(osId)
      return NextResponse.json({
        success: true,
        data: resumo
      })
    }

    const despesas = await buscarDespesasConsolidadas(osId)

    // Calcular totais
    const totais = {
      total: despesas.reduce((acc, d) => acc + d.valor, 0),
      pago: despesas.filter(d => d.statusPagamento === 'pago').reduce((acc, d) => acc + d.valor, 0),
      pendente: despesas.filter(d => d.statusPagamento !== 'pago').reduce((acc, d) => acc + d.valor, 0),
      porStatus: {
        pendente: despesas.filter(d => d.statusPagamento === 'pendente').length,
        pago: despesas.filter(d => d.statusPagamento === 'pago').length,
        atrasado: despesas.filter(d => d.statusPagamento === 'atrasado').length,
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        despesas,
        totais
      }
    })
  } catch (error: any) {
    console.error('[OS Despesas] Erro ao listar:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao listar despesas' },
      { status: 500 }
    )
  }
}
