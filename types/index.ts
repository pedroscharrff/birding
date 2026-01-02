// Re-export Prisma types
export type {
  Organizacao,
  Usuario,
  Fornecedor,
  OS,
  Participante,
  OSFornecedor,
  Atividade,
  Hospedagem,
  Transporte,
  PassagemAerea,
  GuiaDesignacao,
  MotoristaDesignacao,
  Scouting,
  LancamentoFinanceiro,
  PagamentoOS,
  Anotacao,
  HistoricoStatus,
  EventoCalendario,
  AuditoriaOS,
  Moeda,
  StatusOS,
  StatusPagamento,
  TipoTransporte,
  TipoLancamento,
  CategoriaLancamento,
  RoleGlobal,
  TipoFornecedor,
  CategoriaOSFornecedor,
  RegimeHospedagem,
  CategoriaPassagemAerea,
  TipoEventoCalendario,
  RecursoCalendario,
  AcaoAuditoria,
  EntidadeAuditoria,
} from '@prisma/client'

import type { OS as PrismaOS, AuditoriaOS as PrismaAuditoriaOS } from '@prisma/client'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Dashboard types
export interface DashboardStats {
  totalOS: number
  osEmAndamento: number
  osProximasSemana: number
  lancamentosPendentes: number
}

// Kanban types
export interface KanbanColumn {
  id: string
  title: string
  status: string
  items: PrismaOS[]
}

// Calendar types
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end?: Date
  type: string
  osId: string
  resourceId?: string
  backgroundColor?: string
  borderColor?: string
}

// Permission types
export type Permission = 
  | 'criar'
  | 'ler'
  | 'atualizar'
  | 'excluir'
  | 'atribuir_papeis'
  | 'fechar'
  | 'ler_designadas'
  | 'atualizar_checklist_guia'
  | 'inserir_despesa_guia'
  | 'atualizar_checklist_motorista'
  | 'inserir_despesa_motorista'
  | 'ler_servicos_designados'
  | 'ler_resumo'
  | 'lançar'
  | 'editar'
  | 'conciliar'
  | 'encerrar_periodo'
  | 'lançar_despesa_pessoal'

export interface RolePermissions {
  os: Permission[]
  financeiro: Permission[]
}

// Auditoria types
export interface LogAuditoriaParams {
  osId: string
  usuarioId: string
  acao: string // AcaoAuditoria
  entidade: string // EntidadeAuditoria
  entidadeId?: string
  dadosAntigos?: any
  dadosNovos?: any
  descricao?: string
  metadata?: Record<string, any>
}

export interface AuditoriaMetadata {
  method?: string
  url?: string
  ip?: string
  userAgent?: string
  duration?: number
  [key: string]: any
}

export interface AuditoriaFilters {
  osId?: string
  usuarioId?: string
  acao?: string
  entidade?: string
  entidadeId?: string
  dataInicio?: Date | string
  dataFim?: Date | string
  page?: number
  limit?: number
}

export interface AuditoriaComUsuario extends PrismaAuditoriaOS {
  usuario: {
    id: string
    nome: string
    email: string
    roleGlobal: string
  }
}

export interface CampoAlterado {
  campo: string
  valorAntigo: any
  valorNovo: any
}

export interface AuditoriaResumida {
  totalAcoes: number
  acoesUltimas24h: number
  usuariosMaisAtivos: {
    usuarioId: string
    usuarioNome: string
    quantidade: number
  }[]
  entidadesMaisAlteradas: {
    entidade: string
    quantidade: number
  }[]
}

// ============================================
// TIPOS FINANCEIROS
// ============================================

// Resumo financeiro de uma OS
export interface OSFinanceiroResumo {
  osId: string
  valorVenda: number
  valorRecebido: number
  saldoReceber: number
  custoEstimado: number
  custoReal: number
  margem: number
  margemPercentual: number
  statusPagamento: 'pago' | 'parcial' | 'pendente' | 'atrasado'
}

// Detalhamento de custos por categoria
export interface CustosDetalhados {
  hospedagem: number
  transporte: number
  atividades: number
  passagensAereas: number
  guias: number
  motoristas: number
  outros: number
  total: number
}

// Resumo de pagamentos (parcelas)
export interface PagamentosResumo {
  entradas: {
    total: number
    recebido: number
    pendente: number
    pagamentos: Array<{
      id: string
      descricao: string
      valor: number
      dataVencimento: Date
      dataPagamento?: Date
      status: string
      formaPagamento?: string
    }>
  }
  saidas: {
    total: number
    pago: number
    pendente: number
    pagamentos: Array<{
      id: string
      descricao: string
      valor: number
      dataVencimento: Date
      dataPagamento?: Date
      status: string
      fornecedor?: {
        id: string
        nomeFantasia: string
      }
    }>
  }
}

// Dashboard Financeiro
export interface DashboardFinanceiro {
  periodo: {
    inicio: Date
    fim: Date
  }
  receitas: {
    total: number
    recebido: number
    aReceber: number
  }
  custos: {
    total: number
    pago: number
    aPagar: number
  }
  lucro: {
    total: number
    percentual: number
  }
  osRentaveis: Array<{
    osId: string
    titulo: string
    destino: string
    margem: number
    margemPercentual: number
  }>
  contasReceber: Array<{
    osId: string
    titulo: string
    valor: number
    dataVencimento: Date
    diasAtraso?: number
  }>
  contasPagar: Array<{
    osId: string
    titulo: string
    fornecedor: string
    valor: number
    dataVencimento: Date
    diasAtraso?: number
  }>
}

// Fluxo de Caixa
export interface FluxoCaixaItem {
  data: Date
  entradas: number
  saidas: number
  saldo: number
  acumulado: number
}

export interface FluxoCaixa {
  periodoInicio: Date
  periodoFim: Date
  saldoInicial: number
  saldoFinal: number
  items: FluxoCaixaItem[]
}

// Formas de pagamento disponíveis
export type FormaPagamento =
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'boleto'
  | 'dinheiro'
  | 'transferencia'
  | 'deposito'
  | 'cheque'
