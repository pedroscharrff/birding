/**
 * Serviço para consolidação e gerenciamento de despesas da OS
 */

import { prisma } from '@/lib/db/prisma'

export interface DespesaConsolidada {
  id: string
  tipo: 'hospedagem' | 'transporte' | 'atividade' | 'passagem_aerea'
  descricao: string
  fornecedor: {
    id: string
    nomeFantasia: string
  } | null
  valor: number
  moeda: string
  statusPagamento: string
  dataPagamento: Date | null
  formaPagamento: string | null
  referenciaPagamento: string | null
  dataReferencia: Date | null // data da atividade/checkin/partida
}

/**
 * Busca todas as despesas de uma OS consolidadas
 */
export async function buscarDespesasConsolidadas(osId: string): Promise<DespesaConsolidada[]> {
  const [hospedagens, transportes, atividades, passagensAereas] = await Promise.all([
    prisma.hospedagem.findMany({
      where: { osId },
      include: { fornecedor: { select: { id: true, nomeFantasia: true } } }
    }),
    prisma.transporte.findMany({
      where: { osId },
      include: { fornecedor: { select: { id: true, nomeFantasia: true } } }
    }),
    prisma.atividade.findMany({
      where: { osId },
      include: { fornecedor: { select: { id: true, nomeFantasia: true } } }
    }),
    prisma.passagemAerea.findMany({
      where: { osId }
    })
  ])

  const despesas: DespesaConsolidada[] = []

  // Hospedagens
  hospedagens.forEach(h => {
    despesas.push({
      id: h.id,
      tipo: 'hospedagem',
      descricao: `Hospedagem - ${h.hotelNome}`,
      fornecedor: h.fornecedor,
      valor: Number(h.custoTotal || 0),
      moeda: h.moeda,
      statusPagamento: h.statusPagamento,
      dataPagamento: h.dataPagamento,
      formaPagamento: h.formaPagamento,
      referenciaPagamento: h.referenciaPagamento,
      dataReferencia: h.checkin
    })
  })

  // Transportes
  transportes.forEach(t => {
    despesas.push({
      id: t.id,
      tipo: 'transporte',
      descricao: `Transporte - ${t.tipo.replace('_', ' ')} ${t.origem ? `de ${t.origem}` : ''} ${t.destino ? `para ${t.destino}` : ''}`,
      fornecedor: t.fornecedor || null,
      valor: Number(t.custo || 0),
      moeda: t.moeda,
      statusPagamento: t.statusPagamento,
      dataPagamento: t.dataPagamento,
      formaPagamento: t.formaPagamento,
      referenciaPagamento: t.referenciaPagamento,
      dataReferencia: t.dataPartida
    })
  })

  // Atividades
  atividades.forEach(a => {
    despesas.push({
      id: a.id,
      tipo: 'atividade',
      descricao: `Atividade - ${a.nome}`,
      fornecedor: a.fornecedor || null,
      valor: Number(a.valor || 0),
      moeda: a.moeda,
      statusPagamento: a.statusPagamento,
      dataPagamento: a.dataPagamento,
      formaPagamento: a.formaPagamento,
      referenciaPagamento: a.referenciaPagamento,
      dataReferencia: a.data
    })
  })

  // Passagens Aéreas
  passagensAereas.forEach(p => {
    despesas.push({
      id: p.id,
      tipo: 'passagem_aerea',
      descricao: `Passagem Aérea - ${p.passageiroNome} ${p.trecho ? `(${p.trecho})` : ''}`,
      fornecedor: null,
      valor: Number(p.custo || 0),
      moeda: p.moeda,
      statusPagamento: p.statusPagamento,
      dataPagamento: p.dataPagamento,
      formaPagamento: p.formaPagamento,
      referenciaPagamento: p.referenciaPagamento,
      dataReferencia: p.dataPartida
    })
  })

  // Ordenar por data de referência (mais recente primeiro)
  despesas.sort((a, b) => {
    if (!a.dataReferencia) return 1
    if (!b.dataReferencia) return -1
    return new Date(b.dataReferencia).getTime() - new Date(a.dataReferencia).getTime()
  })

  return despesas
}

/**
 * Atualiza o status de pagamento de uma despesa
 */
export async function atualizarStatusPagamentoDespesa(
  tipo: 'hospedagem' | 'transporte' | 'atividade' | 'passagem_aerea',
  id: string,
  dados: {
    statusPagamento: string
    dataPagamento?: Date | null
    formaPagamento?: string | null
    referenciaPagamento?: string | null
    comprovantes?: any[] | null
  }
) {
  const updateData: any = {
    statusPagamento: dados.statusPagamento as any
  }

  if (dados.dataPagamento !== undefined) {
    updateData.dataPagamento = dados.dataPagamento
  }
  if (dados.formaPagamento !== undefined) {
    updateData.formaPagamento = dados.formaPagamento
  }
  if (dados.referenciaPagamento !== undefined) {
    updateData.referenciaPagamento = dados.referenciaPagamento
  }
  if (dados.comprovantes !== undefined) {
    updateData.comprovantes = dados.comprovantes
  }

  switch (tipo) {
    case 'hospedagem':
      return await prisma.hospedagem.update({
        where: { id },
        data: updateData
      })
    case 'transporte':
      return await prisma.transporte.update({
        where: { id },
        data: updateData
      })
    case 'atividade':
      return await prisma.atividade.update({
        where: { id },
        data: updateData
      })
    case 'passagem_aerea':
      return await prisma.passagemAerea.update({
        where: { id },
        data: updateData
      })
  }
}

/**
 * Resumo de pagamentos por fornecedor
 */
export async function resumoPagamentosPorFornecedor(osId: string) {
  const despesas = await buscarDespesasConsolidadas(osId)

  const resumo = new Map<string, {
    fornecedor: { id: string; nomeFantasia: string }
    total: number
    pago: number
    pendente: number
    despesas: DespesaConsolidada[]
  }>()

  despesas.forEach(d => {
    if (!d.fornecedor) return

    const key = d.fornecedor.id
    if (!resumo.has(key)) {
      resumo.set(key, {
        fornecedor: d.fornecedor,
        total: 0,
        pago: 0,
        pendente: 0,
        despesas: []
      })
    }

    const item = resumo.get(key)!
    item.total += d.valor
    if (d.statusPagamento === 'pago') {
      item.pago += d.valor
    } else {
      item.pendente += d.valor
    }
    item.despesas.push(d)
  })

  return Array.from(resumo.values())
}
