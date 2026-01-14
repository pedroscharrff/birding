/**
 * Sistema de Validações de Transição de Status
 * 
 * Define regras de negócio para validar se uma OS pode
 * avançar de um status para outro.
 */

import { StatusOS } from '@prisma/client'

export interface ValidationRule {
  field: string
  label: string
  validator: (data: any) => boolean
  errorMessage: string
}

export interface ChecklistItem {
  id: string
  label: string
  description?: string
  completed: boolean
  required: boolean
  field?: string
}

export interface StatusTransitionValidation {
  fromStatus: StatusOS
  toStatus: StatusOS
  requiredChecklist: ChecklistItem[]
  recommendedChecklist: ChecklistItem[]
  canProceed: boolean
  blockers: string[]
  checks: Array<{
    id: string
    categoria: string
    descricao: string
    status: 'ok' | 'blocker' | 'warning'
    obrigatorio: boolean
    detalhes?: string
  }>
  warnings: Array<{
    id: string
    categoria: string
    descricao: string
    status: 'ok' | 'blocker' | 'warning'
    obrigatorio: boolean
    detalhes?: string
  }>
}

// Checklists por transição de status
export const STATUS_CHECKLISTS: Record<string, {
  required: Omit<ChecklistItem, 'id' | 'completed'>[]
  recommended: Omit<ChecklistItem, 'id' | 'completed'>[]
}> = {
  // Planejamento → Cotações
  'planejamento_cotacoes': {
    required: [
      {
        label: 'Destino definido',
        field: 'destino',
        required: true,
      },
      {
        label: 'Datas confirmadas',
        field: 'dataInicio',
        required: true,
      },
      {
        label: 'Pelo menos 1 participante cadastrado',
        field: 'participantes',
        required: true,
      },
    ],
    recommended: [
      {
        label: 'Orçamento estimado definido',
        field: 'custoEstimado',
        required: false,
      },
      {
        label: 'Fornecedores identificados',
        field: 'fornecedores',
        required: false,
      },
    ],
  },

  // Cotações → Reservas Pendentes
  'cotacoes_reservas_pendentes': {
    required: [
      {
        label: 'Pelo menos 3 cotações recebidas',
        field: 'fornecedores',
        required: true,
      },
      {
        label: 'Valor de venda definido',
        field: 'valorVenda',
        required: true,
      },
      {
        label: 'Margem de lucro mínima de 15%',
        field: 'margemEstimada',
        required: true,
      },
    ],
    recommended: [
      {
        label: 'Entrada de 30% negociada',
        field: 'pagamentos',
        required: false,
      },
      {
        label: 'Todos os participantes confirmados',
        field: 'participantes',
        required: false,
      },
    ],
  },

  // Reservas Pendentes → Reservas Confirmadas
  'reservas_pendentes_reservas_confirmadas': {
    required: [
      {
        label: 'Todas as hospedagens confirmadas',
        field: 'hospedagens',
        required: true,
      },
      {
        label: 'Transportes confirmados',
        field: 'transportes',
        required: true,
      },
      {
        label: 'Entrada recebida (mínimo 30%)',
        field: 'valorRecebido',
        required: true,
      },
    ],
    recommended: [
      {
        label: 'Atividades confirmadas',
        field: 'atividades',
        required: false,
      },
      {
        label: 'Guia designado',
        field: 'guias',
        required: false,
      },
    ],
  },

  // Reservas Confirmadas → Documentação
  'reservas_confirmadas_documentacao': {
    required: [
      {
        label: 'Todos os fornecedores confirmados',
        field: 'fornecedores',
        required: true,
      },
      {
        label: 'Pelo menos 50% do valor recebido',
        field: 'valorRecebido',
        required: true,
      },
    ],
    recommended: [
      {
        label: 'Vouchers gerados',
        field: 'vouchers',
        required: false,
      },
      {
        label: 'Roteiro detalhado criado',
        field: 'roteiro',
        required: false,
      },
    ],
  },

  // Documentação → Pronto para Viagem
  'documentacao_pronto_para_viagem': {
    required: [
      {
        label: 'Todos os participantes com documentos válidos',
        field: 'participantes',
        required: true,
      },
      {
        label: 'Guia designado',
        field: 'guias',
        required: true,
      },
      {
        label: 'Motorista designado (se necessário)',
        field: 'motoristas',
        required: true,
      },
      {
        label: 'Roteiro finalizado',
        field: 'roteiro',
        required: true,
      },
    ],
    recommended: [
      {
        label: 'Valor total recebido',
        field: 'valorRecebido',
        required: false,
      },
      {
        label: 'Briefing enviado aos participantes',
        field: 'briefing',
        required: false,
      },
    ],
  },

  // Pronto para Viagem → Em Andamento
  'pronto_para_viagem_em_andamento': {
    required: [
      {
        label: 'Data de início chegou',
        field: 'dataInicio',
        required: true,
      },
      {
        label: 'Todos os preparativos finalizados',
        field: 'checklist',
        required: true,
      },
    ],
    recommended: [
      {
        label: 'Check-in realizado',
        field: 'checkin',
        required: false,
      },
    ],
  },

  // Em Andamento → Concluída
  'em_andamento_concluida': {
    required: [
      {
        label: 'Data de término passou',
        field: 'dataFim',
        required: true,
      },
      {
        label: 'Todas as despesas pagas',
        field: 'despesas',
        required: true,
      },
    ],
    recommended: [
      {
        label: 'Feedback dos participantes coletado',
        field: 'feedback',
        required: false,
      },
      {
        label: 'Fotos/relatório final',
        field: 'relatorio',
        required: false,
      },
    ],
  },

  // Concluída → Pós-Viagem
  'concluida_pos_viagem': {
    required: [
      {
        label: 'Valor total recebido',
        field: 'valorRecebido',
        required: true,
      },
      {
        label: 'Todas as despesas quitadas',
        field: 'despesas',
        required: true,
      },
    ],
    recommended: [
      {
        label: 'Relatório financeiro fechado',
        field: 'relatorioFinanceiro',
        required: false,
      },
      {
        label: 'Avaliação de satisfação enviada',
        field: 'avaliacao',
        required: false,
      },
    ],
  },
}

// Validações de margem mínima
export const MARGEM_MINIMA_PERCENTUAL = 15

// Validações de entrada mínima
export const ENTRADA_MINIMA_PERCENTUAL = 30

// Prazo mínimo para designação de guia (dias antes da OS)
export const PRAZO_MINIMO_GUIA_DIAS = 15

// Prazo mínimo para designação de motorista (dias antes da OS)
export const PRAZO_MINIMO_MOTORISTA_DIAS = 10

// Prazo mínimo para confirmação de hospedagens (dias antes da OS)
export const PRAZO_MINIMO_HOSPEDAGEM_DIAS = 7
