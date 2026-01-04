export interface ResumoFinanceiro {
  periodo: {
    tipo: string
    dataInicio: string
    dataFim: string
  }
  resumo: {
    receitas: {
      total: number
      recebido: number
      aReceber: number
      atrasado: number
      quantidadeAtrasados: number
    }
    despesas: {
      total: number
      pagas: number
      aPagar: number
      atrasadas: number
      quantidadeAtrasadas: number
      detalhamento: {
        hospedagem: number
        transporte: number
        atividades: number
        passagens: number
      }
    }
    lucro: {
      estimado: number
      margemPercentual: number
    }
    fluxoCaixa: {
      real: number
      saldoPendente: number
    }
  }
  os: {
    total: number
    porStatus: Array<{
      status: string
      quantidade: number
      valorTotal: number
      valorRecebido: number
    }>
  }
  topFornecedores: Array<{
    fornecedorId: string | null
    fornecedorNome: string
    totalPago: number
    quantidadePagamentos: number
  }>
  lancamentos: {
    entradas: number
    saidas: number
  }
}

export interface FluxoCaixaMensal {
  mes: string
  mesCompleto: string
  dataInicio: Date
  dataFim: Date
  entradas: number
  saidas: number
  saldo: number
}
