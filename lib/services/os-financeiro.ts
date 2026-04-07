/**
 * Serviço de cálculos e operações financeiras para OS
 */

import { prisma } from '@/lib/db/prisma'
import type { CustosDetalhados, OSFinanceiroResumo, PagamentosResumo } from '@/types'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Calcula o custo total detalhado de uma OS
 */
// Converte valor para BRL usando cotacaoAtual quando disponível
function valorParaBRL(valor: number, moeda: string, cotacaoAtual: number | null | undefined): number {
  if (moeda !== 'BRL' && cotacaoAtual) {
    return valor * cotacaoAtual
  }
  return valor
}

export async function calcularCustosOS(osId: string, extensaoId?: string | null): Promise<CustosDetalhados> {
  const where: any = { osId }

  if (extensaoId !== undefined) {
    where.extensaoId = extensaoId
  }

  // Custos de hospedagem (convertendo moeda estrangeira)
  const hospedagensRows = await prisma.hospedagem.findMany({
    where,
    select: { custoTotal: true, moeda: true, cotacaoAtual: true }
  })

  // Custos de transporte (convertendo moeda estrangeira)
  const transportesRows = await prisma.transporte.findMany({
    where,
    select: { custo: true, moeda: true, cotacaoAtual: true }
  })

  // Custos de atividades (convertendo moeda estrangeira)
  const atividadesRows = await prisma.atividade.findMany({
    where,
    select: { valor: true, moeda: true, cotacaoAtual: true }
  })

  // Custos de passagens aéreas (convertendo moeda estrangeira)
  const passagensRows = await prisma.passagemAerea.findMany({
    where,
    select: { custo: true, moeda: true, cotacaoAtual: true }
  })

  // Outros custos (lançamentos financeiros de saída)
  const lancamentosWhere = { ...where, tipo: { in: ['saida', 'adiantamento'] } }
  const lancamentosRows = await prisma.lancamentoFinanceiro.findMany({
    where: lancamentosWhere,
    select: { valor: true, moeda: true, cotacaoAtual: true }
  })

  const hospedagem = hospedagensRows.reduce((acc, h) =>
    acc + valorParaBRL(Number(h.custoTotal || 0), h.moeda, h.cotacaoAtual ? Number(h.cotacaoAtual) : null), 0)
  const transporte = transportesRows.reduce((acc, t) =>
    acc + valorParaBRL(Number(t.custo || 0), t.moeda, t.cotacaoAtual ? Number(t.cotacaoAtual) : null), 0)
  const atividadesTotal = atividadesRows.reduce((acc, a) =>
    acc + valorParaBRL(Number(a.valor || 0), a.moeda, a.cotacaoAtual ? Number(a.cotacaoAtual) : null), 0)
  const passagensAereas = passagensRows.reduce((acc, p) =>
    acc + valorParaBRL(Number(p.custo || 0), p.moeda, p.cotacaoAtual ? Number(p.cotacaoAtual) : null), 0)
  const outros = lancamentosRows.reduce((acc, l) =>
    acc + valorParaBRL(Number(l.valor || 0), l.moeda, l.cotacaoAtual ? Number(l.cotacaoAtual) : null), 0)

  // Calcular custos de guias e motoristas (se tiver lançamentos específicos)
  const guias = 0 // TODO: Implementar quando tiver sistema de custos de guias
  const motoristas = 0 // TODO: Implementar quando tiver sistema de custos de motoristas

  const total = hospedagem + transporte + atividadesTotal + passagensAereas + guias + motoristas + outros

  return {
    hospedagem,
    transporte,
    atividades: atividadesTotal,
    passagensAereas,
    guias,
    motoristas,
    outros,
    total
  }
}

/**
 * Calcula a margem de lucro de uma OS
 */
export async function calcularMargemOS(osId: string, extensaoId?: string | null) {
  if (extensaoId !== undefined) {
    // Se filtrando por extensão, não temos dados de receita/venda específicos da extensão no schema atual
    // Então retornamos apenas os custos reais filtrados pela extensão
    const custos = await calcularCustosOS(osId, extensaoId)
    
    return {
      receita: 0,
      recebido: 0,
      saldoReceber: 0,
      custoEstimado: 0,
      custoReal: custos.total,
      lucroEstimado: -custos.total, // Prejuízo técnico pois receita = 0
      lucroReal: -custos.total,
      margemEstimadaPercent: 0,
      margemRealPercent: 0,
      custosDetalhados: custos
    }
  }

  const os = await prisma.oS.findUnique({
    where: { id: osId },
    select: {
      valorVenda: true,
      custoEstimado: true,
    }
  })

  if (!os) {
    throw new Error('OS não encontrada')
  }

  // Calcular custos dinamicamente (já converte moeda estrangeira via cotacaoAtual)
  const custos = await calcularCustosOS(osId)

  // Calcular recebido dinamicamente a partir dos pagamentos de entrada pagos
  // (garante sempre o valor correto, inclusive com conversão de moeda)
  const pagamentosEntrada = await prisma.pagamentoOS.findMany({
    where: { osId, tipo: 'entrada', status: 'pago' },
    select: { valor: true, moeda: true, cotacaoAtual: true }
  })
  const recebido = pagamentosEntrada.reduce((acc, p) => {
    const valor = Number(p.valor)
    if (p.moeda !== 'BRL' && p.cotacaoAtual) {
      return acc + valor * Number(p.cotacaoAtual)
    }
    return acc + valor
  }, 0)

  // Também atualiza o campo armazenado na OS para compatibilidade
  await prisma.oS.update({
    where: { id: osId },
    data: { valorRecebido: new Decimal(recebido) }
  })

  const receita = Number(os.valorVenda || 0)
  const custoRealCalculado = custos.total
  const custoEstimadoCalculado = Number(os.custoEstimado || custos.total)

  const lucroEstimado = receita - custoEstimadoCalculado
  const lucroReal = receita - custoRealCalculado
  const margemEstimadaPercent = receita > 0 ? (lucroEstimado / receita) * 100 : 0
  const margemRealPercent = receita > 0 ? (lucroReal / receita) * 100 : 0

  return {
    receita,
    recebido,
    saldoReceber: receita - recebido,
    custoEstimado: custoEstimadoCalculado,
    custoReal: custoRealCalculado,
    lucroEstimado,
    lucroReal,
    margemEstimadaPercent,
    margemRealPercent,
    custosDetalhados: custos
  }
}

/**
 * Obtém resumo financeiro completo de uma OS
 */
export async function obterResumoFinanceiroOS(osId: string, extensaoId?: string | null): Promise<OSFinanceiroResumo> {
  const margem = await calcularMargemOS(osId, extensaoId)

  const wherePagamento: any = { osId, tipo: 'entrada' }
  if (extensaoId !== undefined) {
    wherePagamento.extensaoId = extensaoId
  }

  // Verificar status de pagamento
  const pagamentos = await prisma.pagamentoOS.findMany({
    where: wherePagamento
  })

  let statusPagamento: 'pago' | 'parcial' | 'pendente' | 'atrasado' = 'pendente'

  if (margem.recebido >= margem.receita && margem.receita > 0) {
    statusPagamento = 'pago'
  } else if (margem.recebido > 0) {
    statusPagamento = 'parcial'
  }

  // Verificar se há pagamentos atrasados
  const hoje = new Date()
  const atrasados = pagamentos.some(p =>
    p.status === 'pendente' && new Date(p.dataVencimento) < hoje
  )
  if (atrasados) {
    statusPagamento = 'atrasado'
  }

  return {
    osId,
    valorVenda: margem.receita,
    valorRecebido: margem.recebido,
    saldoReceber: margem.saldoReceber,
    custoEstimado: margem.custoEstimado,
    custoReal: margem.custoReal,
    margem: margem.lucroReal,
    margemPercentual: margem.margemRealPercent,
    statusPagamento
  }
}

/**
 * Obtém resumo de todos os pagamentos (entradas e saídas) de uma OS
 */
export async function obterPagamentosOS(osId: string, extensaoId?: string | null): Promise<PagamentosResumo> {
  const where: any = { osId }
  if (extensaoId !== undefined) {
    where.extensaoId = extensaoId
  }

  const pagamentos = await prisma.pagamentoOS.findMany({
    where,
    include: {
      fornecedor: {
        select: {
          id: true,
          nomeFantasia: true
        }
      }
    },
    orderBy: { dataVencimento: 'asc' }
  })

  const entradas = pagamentos.filter(p => p.tipo === 'entrada')
  const saidas = pagamentos.filter(p => p.tipo === 'saida')

  // Converte valor para BRL usando cotacaoAtual quando disponível
  const toBRL = (p: typeof pagamentos[0]) => {
    const valor = Number(p.valor)
    if (p.moeda !== 'BRL' && p.cotacaoAtual) {
      return valor * Number(p.cotacaoAtual)
    }
    return valor
  }

  const entradasTotal = entradas.reduce((acc, p) => acc + toBRL(p), 0)
  const entradasRecebido = entradas
    .filter(p => p.status === 'pago')
    .reduce((acc, p) => acc + toBRL(p), 0)
  const entradasPendente = entradasTotal - entradasRecebido

  const saidasTotal = saidas.reduce((acc, p) => acc + toBRL(p), 0)
  const saidasPago = saidas
    .filter(p => p.status === 'pago')
    .reduce((acc, p) => acc + toBRL(p), 0)
  const saidasPendente = saidasTotal - saidasPago

  return {
    entradas: {
      total: entradasTotal,
      recebido: entradasRecebido,
      pendente: entradasPendente,
      pagamentos: entradas.map(p => ({
        id: p.id,
        descricao: p.descricao,
        valor: Number(p.valor),
        moeda: p.moeda,
        dataVencimento: p.dataVencimento,
        dataPagamento: p.dataPagamento || undefined,
        status: p.status,
        formaPagamento: p.formaPagamento || undefined,
        comprovanteUrl: p.comprovanteUrl || undefined,
        cotacaoAtual: p.cotacaoAtual ? Number(p.cotacaoAtual) : undefined
      }))
    },
    saidas: {
      total: saidasTotal,
      pago: saidasPago,
      pendente: saidasPendente,
      pagamentos: saidas.map(p => ({
        id: p.id,
        descricao: p.descricao,
        valor: Number(p.valor),
        moeda: p.moeda,
        dataVencimento: p.dataVencimento,
        dataPagamento: p.dataPagamento || undefined,
        status: p.status,
        fornecedor: p.fornecedor || undefined,
        comprovanteUrl: p.comprovanteUrl || undefined,
        cotacaoAtual: p.cotacaoAtual ? Number(p.cotacaoAtual) : undefined
      }))
    }
  }
}

/**
 * Atualiza o valor recebido na OS baseado nos pagamentos registrados
 */
export async function atualizarValorRecebidoOS(osId: string): Promise<void> {
  const pagamentos = await prisma.pagamentoOS.findMany({
    where: {
      osId,
      tipo: 'entrada',
      status: 'pago'
    }
  })

  // Converter valores em moeda estrangeira para BRL usando a cotação registrada
  const valorRecebido = pagamentos.reduce((acc, p) => {
    const valor = Number(p.valor)
    if (p.moeda !== 'BRL' && p.cotacaoAtual) {
      return acc + valor * Number(p.cotacaoAtual)
    }
    return acc + valor
  }, 0)

  await prisma.oS.update({
    where: { id: osId },
    data: { valorRecebido: new Decimal(valorRecebido) }
  })
}

/**
 * Atualiza o custo real da OS baseado nos custos registrados
 */
export async function atualizarCustoRealOS(osId: string): Promise<void> {
  const custos = await calcularCustosOS(osId)

  await prisma.oS.update({
    where: { id: osId },
    data: { custoReal: new Decimal(custos.total) }
  })
}
