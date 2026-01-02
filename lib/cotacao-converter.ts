import { Prisma } from "@prisma/client"

export interface CotacaoItem {
  id: string
  fornecedorId?: string
  tarifaId?: string
  descricao: string
  quantidade: number
  valorUnitario: number
  moeda: string
  subtotal: number
  observacoes?: string
}

export interface CotacaoData {
  id: string
  titulo: string
  clienteNome: string
  clienteEmail?: string
  clienteTelefone?: string
  destino: string
  dataInicio?: string
  dataFim?: string
  statusCotacao: string
  observacoesInternas?: string
  observacoesCliente?: string
  responsavel?: string
  hospedagens: CotacaoItem[]
  atividades: CotacaoItem[]
  transportes: CotacaoItem[]
  alimentacoes: CotacaoItem[]
}

export interface ConversaoOSResult {
  osId: string
  participanteId: string
  hospedagensIds: string[]
  atividadesIds: string[]
  transportesIds: string[]
  warnings: string[]
}

export interface ConversaoOSOptions {
  orgId: string
  agenteResponsavelId: string
  cotacao: CotacaoData
}

export function buildOSDataFromCotacao(options: ConversaoOSOptions) {
  const { orgId, agenteResponsavelId, cotacao } = options
  const warnings: string[] = []

  const dataInicio = cotacao.dataInicio 
    ? new Date(cotacao.dataInicio) 
    : new Date()
  
  const dataFim = cotacao.dataFim 
    ? new Date(cotacao.dataFim) 
    : new Date(dataInicio.getTime() + 7 * 24 * 60 * 60 * 1000)

  const totalHospedagens = cotacao.hospedagens.reduce((sum, item) => sum + item.subtotal, 0)
  const totalAtividades = cotacao.atividades.reduce((sum, item) => sum + item.subtotal, 0)
  const totalTransportes = cotacao.transportes.reduce((sum, item) => sum + item.subtotal, 0)
  const totalAlimentacoes = cotacao.alimentacoes.reduce((sum, item) => sum + item.subtotal, 0)
  
  const custoEstimado = totalHospedagens + totalAtividades + totalTransportes + totalAlimentacoes

  const osData: Prisma.OSCreateInput = {
    organizacao: {
      connect: { id: orgId }
    },
    agenteResponsavel: {
      connect: { id: agenteResponsavelId }
    },
    titulo: cotacao.titulo,
    destino: cotacao.destino,
    dataInicio,
    dataFim,
    status: "planejamento",
    descricao: cotacao.observacoesCliente || undefined,
    custoEstimado: new Prisma.Decimal(custoEstimado),
    moedaVenda: "BRL",
    valorRecebido: new Prisma.Decimal(0),
  }

  const participanteData: Prisma.ParticipanteCreateWithoutOsInput = {
    nome: cotacao.clienteNome,
    email: cotacao.clienteEmail || `${cotacao.clienteNome.toLowerCase().replace(/\s+/g, '.')}@temp.com`,
    telefone: cotacao.clienteTelefone || undefined,
    observacoes: cotacao.observacoesInternas || undefined,
  }

  const hospedagensData: Prisma.HospedagemCreateWithoutOsInput[] = cotacao.hospedagens
    .filter(item => item.fornecedorId)
    .map(item => {
      const noites = item.quantidade || 1
      const checkin = new Date(dataInicio)
      const checkout = new Date(checkin.getTime() + noites * 24 * 60 * 60 * 1000)

      return {
        fornecedor: {
          connect: { id: item.fornecedorId! }
        },
        tarifa: item.tarifaId ? {
          connect: { id: item.tarifaId }
        } : undefined,
        hotelNome: item.descricao,
        checkin,
        checkout,
        quartos: 1,
        tipoQuarto: item.observacoes || undefined,
        custoTotal: new Prisma.Decimal(item.subtotal),
        moeda: item.moeda as "BRL" | "USD" | "EUR",
        statusPagamento: "pendente",
      }
    })

  cotacao.hospedagens
    .filter(item => !item.fornecedorId)
    .forEach(item => {
      warnings.push(`Hospedagem "${item.descricao}" não possui fornecedor vinculado e não será convertida`)
    })

  const atividadesData: Prisma.AtividadeCreateWithoutOsInput[] = cotacao.atividades.map(item => ({
    nome: item.descricao,
    valor: new Prisma.Decimal(item.subtotal),
    moeda: item.moeda as "BRL" | "USD" | "EUR",
    quantidadeMaxima: item.quantidade,
    fornecedor: item.fornecedorId ? {
      connect: { id: item.fornecedorId }
    } : undefined,
    notas: item.observacoes || undefined,
    statusPagamento: "pendente",
  }))

  const transportesData: Prisma.TransporteCreateWithoutOsInput[] = cotacao.transportes.map(item => ({
    tipo: "van",
    fornecedor: item.fornecedorId ? {
      connect: { id: item.fornecedorId }
    } : undefined,
    custo: new Prisma.Decimal(item.subtotal),
    moeda: item.moeda as "BRL" | "USD" | "EUR",
    detalhes: {
      descricao: item.descricao,
      quantidade: item.quantidade,
      observacoes: item.observacoes,
    },
    statusPagamento: "pendente",
  }))

  cotacao.alimentacoes.forEach(item => {
    if (item.fornecedorId) {
      atividadesData.push({
        nome: `Alimentação: ${item.descricao}`,
        valor: new Prisma.Decimal(item.subtotal),
        moeda: item.moeda as "BRL" | "USD" | "EUR",
        quantidadeMaxima: item.quantidade,
        fornecedor: {
          connect: { id: item.fornecedorId }
        },
        notas: item.observacoes || undefined,
        statusPagamento: "pendente",
      })
    } else {
      warnings.push(`Alimentação "${item.descricao}" não possui fornecedor vinculado e será adicionada como atividade sem fornecedor`)
      atividadesData.push({
        nome: `Alimentação: ${item.descricao}`,
        valor: new Prisma.Decimal(item.subtotal),
        moeda: item.moeda as "BRL" | "USD" | "EUR",
        quantidadeMaxima: item.quantidade,
        notas: item.observacoes || undefined,
        statusPagamento: "pendente",
      })
    }
  })

  return {
    osData,
    participanteData,
    hospedagensData,
    atividadesData,
    transportesData,
    warnings,
  }
}

export async function converterCotacaoParaOS(
  prisma: any,
  options: ConversaoOSOptions
): Promise<ConversaoOSResult> {
  const { osData, participanteData, hospedagensData, atividadesData, transportesData, warnings } = 
    buildOSDataFromCotacao(options)

  const os = await prisma.oS.create({
    data: {
      ...osData,
      participantes: {
        create: [participanteData]
      },
      hospedagens: hospedagensData.length > 0 ? {
        create: hospedagensData
      } : undefined,
      atividades: atividadesData.length > 0 ? {
        create: atividadesData
      } : undefined,
      transportes: transportesData.length > 0 ? {
        create: transportesData
      } : undefined,
    },
    include: {
      participantes: true,
      hospedagens: true,
      atividades: true,
      transportes: true,
    }
  })

  return {
    osId: os.id,
    participanteId: os.participantes[0]?.id || '',
    hospedagensIds: os.hospedagens.map((h: any) => h.id),
    atividadesIds: os.atividades.map((a: any) => a.id),
    transportesIds: os.transportes.map((t: any) => t.id),
    warnings,
  }
}
