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
  Anotacao,
  HistoricoStatus,
  EventoCalendario,
  Moeda,
  StatusOS,
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
} from '@prisma/client'

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
  items: OS[]
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
