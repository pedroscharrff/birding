/**
 * Sistema de Alertas Inteligentes
 * 
 * Define tipos e interfaces para o sistema de alertas proativos
 * que ajudam a prevenir erros e esquecimentos.
 */

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertCategory = 
  | 'financeiro'
  | 'operacional'
  | 'documentacao'
  | 'fornecedor'
  | 'prazo'

export interface Alert {
  id: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  description: string
  osId?: string
  osTitulo?: string
  actionUrl?: string
  actionLabel?: string
  createdAt: Date
  metadata?: Record<string, any>
}

export interface AlertsCount {
  critical: number
  warning: number
  info: number
  total: number
}

export interface AlertsResponse {
  alerts: Alert[]
  count: AlertsCount
}

// Regras de negócio para alertas
export const ALERT_RULES = {
  // Alertas Críticos
  DESPESA_VENCIDA: {
    severity: 'critical' as AlertSeverity,
    category: 'financeiro' as AlertCategory,
    title: 'Despesa vencida não paga',
  },
  PAGAMENTO_ATRASADO: {
    severity: 'critical' as AlertSeverity,
    category: 'financeiro' as AlertCategory,
    title: 'Pagamento de cliente atrasado',
  },
  OS_INICIANDO_SEM_CONFIRMACAO: {
    severity: 'critical' as AlertSeverity,
    category: 'operacional' as AlertCategory,
    title: 'OS iniciando em menos de 48h sem confirmações',
  },
  DOCUMENTO_VENCIDO: {
    severity: 'critical' as AlertSeverity,
    category: 'documentacao' as AlertCategory,
    title: 'Documento de participante vencido',
  },
  FORNECEDOR_SEM_CONFIRMACAO: {
    severity: 'critical' as AlertSeverity,
    category: 'fornecedor' as AlertCategory,
    title: 'Fornecedor sem confirmação próximo à data',
  },

  // Alertas de Atenção
  DESPESA_VENCENDO: {
    severity: 'warning' as AlertSeverity,
    category: 'financeiro' as AlertCategory,
    title: 'Despesa vencendo em 7 dias',
  },
  OS_SEM_GUIA: {
    severity: 'warning' as AlertSeverity,
    category: 'operacional' as AlertCategory,
    title: 'OS sem guia designado',
  },
  OS_SEM_MOTORISTA: {
    severity: 'warning' as AlertSeverity,
    category: 'operacional' as AlertCategory,
    title: 'OS sem motorista designado',
  },
  MARGEM_BAIXA: {
    severity: 'warning' as AlertSeverity,
    category: 'financeiro' as AlertCategory,
    title: 'Margem de lucro abaixo de 15%',
  },
  CUSTO_ACIMA_ESTIMADO: {
    severity: 'warning' as AlertSeverity,
    category: 'financeiro' as AlertCategory,
    title: 'Custos reais excedem estimativa',
  },

  // Alertas Informativos
  STATUS_ALTERADO: {
    severity: 'info' as AlertSeverity,
    category: 'operacional' as AlertCategory,
    title: 'Status da OS alterado',
  },
  PARTICIPANTE_ADICIONADO: {
    severity: 'info' as AlertSeverity,
    category: 'operacional' as AlertCategory,
    title: 'Novo participante adicionado',
  },
  PAGAMENTO_RECEBIDO: {
    severity: 'info' as AlertSeverity,
    category: 'financeiro' as AlertCategory,
    title: 'Pagamento recebido',
  },
} as const
