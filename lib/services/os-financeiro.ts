/**
 * Serviço de cálculos e operações financeiras para OS
 */

import { prisma } from '@/lib/db/prisma'
import type { CustosDetalhados, OSFinanceiroResumo, PagamentosResumo } from '@/types'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Calcula o custo total detalhado de uma OS
 */
export async function calcularCustosOS(osId: string): Promise<CustosDetalhados> {
  // Custos de hospedagem
  const hospedagens = await prisma.hospedagem.aggregate({
    where: { osId },
    _sum: { custoTotal: true }
  })

  // Custos de transporte
  const transportes = await prisma.transporte.aggregate({
    where: { osId },
    _sum: { custo: true }
  })

  // Custos de atividades
  const atividades = await prisma.atividade.aggregate({
    where: { osId },
    _sum: { valor: true }
  })

  // Custos de passagens aéreas
  const passagens = await prisma.passagemAerea.aggregate({
    where: { osId },
    _sum: { custo: true }
  })

  // Outros custos (lançamentos financeiros de saída)
  const lancamentos = await prisma.lancamentoFinanceiro.aggregate({
    where: {
      osId,
      tipo: { in: ['saida', 'adiantamento'] }
    },
    _sum: { valor: true }
  })

  const hospedagem = Number(hospedagens._sum.custoTotal || 0)
  const transporte = Number(transportes._sum.custo || 0)
  const atividadesTotal = Number(atividades._sum.valor || 0)
  const passagensAereas = Number(passagens._sum.custo || 0)
  const outros = Number(lancamentos._sum.valor || 0)

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
export async function calcularMargemOS(osId: string) {
  const os = await prisma.oS.findUnique({
    where: { id: osId },
    select: {
      valorVenda: true,
      valorRecebido: true,
      custoEstimado: true,
      custoReal: true
    }
  })

  if (!os) {
    throw new Error('OS não encontrada')
  }

  const custos = await calcularCustosOS(osId)

  const receita = Number(os.valorVenda || 0)
  const recebido = Number(os.valorRecebido || 0)
  const custoRealCalculado = Number(os.custoReal || custos.total)
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
export async function obterResumoFinanceiroOS(osId: string): Promise<OSFinanceiroResumo> {
  const margem = await calcularMargemOS(osId)

  // Verificar status de pagamento
  const pagamentos = await prisma.pagamentoOS.findMany({
    where: { osId, tipo: 'entrada' }
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
export async function obterPagamentosOS(osId: string): Promise<PagamentosResumo> {
  const pagamentos = await prisma.pagamentoOS.findMany({
    where: { osId },
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

  const entradasTotal = entradas.reduce((acc, p) => acc + Number(p.valor), 0)
  const entradasRecebido = entradas
    .filter(p => p.status === 'pago')
    .reduce((acc, p) => acc + Number(p.valor), 0)
  const entradasPendente = entradasTotal - entradasRecebido

  const saidasTotal = saidas.reduce((acc, p) => acc + Number(p.valor), 0)
  const saidasPago = saidas
    .filter(p => p.status === 'pago')
    .reduce((acc, p) => acc + Number(p.valor), 0)
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
        dataVencimento: p.dataVencimento,
        dataPagamento: p.dataPagamento || undefined,
        status: p.status,
        formaPagamento: p.formaPagamento || undefined
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
        dataVencimento: p.dataVencimento,
        dataPagamento: p.dataPagamento || undefined,
        status: p.status,
        fornecedor: p.fornecedor || undefined
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

  const valorRecebido = pagamentos.reduce((acc, p) => acc + Number(p.valor), 0)

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
