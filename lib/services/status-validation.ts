/**
 * Serviço de Validação de Transições de Status
 * 
 * Valida se uma OS pode avançar de um status para outro
 * baseado em regras de negócio e checklists obrigatórios.
 */

import { prisma } from '@/lib/db/prisma'
import { StatusOS } from '@prisma/client'
import {
  StatusTransitionValidation,
  ChecklistItem,
  STATUS_CHECKLISTS,
} from '@/types/validations'
import { differenceInDays } from 'date-fns'
import { getActivePolicy, snapshotPolicyForOS, FinanceiroPolicy, PrazosPolicy } from './policy'
import { detectarGuiasFromData } from '@/lib/utils/guia-detection'

/**
 * Valida se uma OS pode transitar de um status para outro
 */
export async function validateStatusTransition(
  osId: string,
  fromStatus: StatusOS,
  toStatus: StatusOS
): Promise<StatusTransitionValidation> {
  // Buscar OS com todos os dados necessários
  const os = await prisma.oS.findUnique({
    where: { id: osId },
    include: {
      participantes: true,
      fornecedores: true,
      hospedagens: true,
      transportes: true,
      atividades: true,
      guiasDesignacao: true,
      motoristasDesignacao: true,
      pagamentos: true,
    },
  })

  if (!os) {
    throw new Error('OS não encontrada')
  }

  // Carregar política ativa da organização
  const policy = await getActivePolicy(os.orgId)
  const financeiro = policy.financeiro as FinanceiroPolicy
  const prazos = policy.prazos as PrazosPolicy

  // Obter checklist para esta transição
  const transitionKey = `${fromStatus}_${toStatus}`
  const checklistConfig = STATUS_CHECKLISTS[transitionKey]

  if (!checklistConfig) {
    // Sem checklist específico, permitir transição
    return {
      fromStatus,
      toStatus,
      requiredChecklist: [],
      recommendedChecklist: [],
      canProceed: true,
      blockers: [],
      checks: [],
      warnings: [],
    }
  }

  // Avaliar checklist obrigatório (usando política)
  const requiredChecklist: ChecklistItem[] = checklistConfig.required.map((item, index) => {
    const completed = evaluateChecklistItem(item.field, os, financeiro, prazos)
    return {
      id: `required-${index}`,
      ...item,
      completed,
    }
  })

  // Avaliar checklist recomendado (usando política)
  const recommendedChecklist: ChecklistItem[] = checklistConfig.recommended.map((item, index) => {
    const completed = evaluateChecklistItem(item.field, os, financeiro, prazos)
    return {
      id: `recommended-${index}`,
      ...item,
      completed,
    }
  })

  // Verificar se pode prosseguir (todos os obrigatórios completos)
  const incompleteRequired = requiredChecklist.filter(item => !item.completed)
  const canProceed = incompleteRequired.length === 0

  // Separar em checks, warnings e blockers para o formato esperado pelo modal
  const checks = requiredChecklist
    .filter(item => item.completed)
    .map(item => ({
      id: item.id,
      categoria: 'Requisito',
      descricao: item.label,
      status: 'ok' as const,
      obrigatorio: item.required,
    }))

  const warnings = recommendedChecklist
    .filter(item => !item.completed)
    .map(item => ({
      id: item.id,
      categoria: 'Recomendado',
      descricao: item.label,
      status: 'warning' as const,
      obrigatorio: false,
    }))

  const blockers = incompleteRequired.map(item => ({
    id: item.id,
    categoria: 'Obrigatório',
    descricao: item.label,
    status: 'blocker' as const,
    obrigatorio: true,
  }))

  return {
    fromStatus,
    toStatus,
    requiredChecklist,
    recommendedChecklist,
    canProceed,
    blockers: blockers.map(b => b.descricao),
    checks,
    warnings,
  }
}

/**
 * Avalia um item do checklist baseado no campo e dados da OS
 * Usa valores da política ativa para validações dinâmicas
 */
function evaluateChecklistItem(
  field: string | undefined,
  os: any,
  financeiro: FinanceiroPolicy,
  prazos: PrazosPolicy
): boolean {
  if (!field) return false

  const hoje = new Date()

  switch (field) {
    case 'destino':
      return !!os.destino && os.destino.trim().length > 0

    case 'dataInicio':
      return !!os.dataInicio && !!os.dataFim

    case 'participantes':
      return os.participantes && os.participantes.length > 0

    case 'custoEstimado':
      return !!os.custoEstimado && Number(os.custoEstimado) > 0

    case 'fornecedores':
      return os.fornecedores && os.fornecedores.length >= 3

    case 'valorVenda':
      return !!os.valorVenda && Number(os.valorVenda) > 0

    case 'margemEstimada':
      if (!os.valorVenda || !os.custoEstimado) return false
      const margem = ((Number(os.valorVenda) - Number(os.custoEstimado)) / Number(os.valorVenda)) * 100
      return margem >= financeiro.margemMinimaPercentual

    case 'hospedagens':
      return os.hospedagens && os.hospedagens.every((h: any) => h.statusPagamento !== 'pendente')

    case 'transportes':
      return os.transportes && os.transportes.every((t: any) => t.statusPagamento !== 'pendente')

    case 'valorRecebido':
      if (!os.valorVenda) return false
      const percentualRecebido = (Number(os.valorRecebido || 0) / Number(os.valorVenda)) * 100
      // Usa percentual mínimo da política
      return percentualRecebido >= financeiro.entradaMinimaPercentual

    case 'atividades':
      return os.atividades && os.atividades.length > 0

    case 'guias':
      const diasAteInicio = differenceInDays(new Date(os.dataInicio), hoje)
      if (diasAteInicio > prazos.prazoMinimoGuiaDias) return true // Ainda tem tempo

      // ✅ CORRIGIDO: Detecta guias INTERNOS (designação) OU EXTERNOS (fornecedor tipo guiamento)
      return detectarGuiasFromData({
        guiasDesignacao: os.guiasDesignacao,
        fornecedores: os.fornecedores,
      })

    case 'motoristas':
      const diasAteInicioMotorista = differenceInDays(new Date(os.dataInicio), hoje)
      const precisaMotorista = os.transportes && os.transportes.some((t: any) =>
        ['van', 'quatro_x_quatro', 'executivo_cidade', 'executivo_fora_cidade'].includes(t.tipo)
      )
      if (!precisaMotorista) return true // Não precisa de motorista
      if (diasAteInicioMotorista > prazos.prazoMinimoMotoristaDias) return true // Ainda tem tempo
      return os.motoristasDesignacao && os.motoristasDesignacao.length > 0

    case 'roteiro':
      // Verificar se tem scouting ou roteiro definido
      return !!os.descricao && os.descricao.length > 50

    case 'dataFim':
      return !!os.dataFim && new Date(os.dataFim) < hoje

    case 'despesas':
      // Verificar se todas as despesas foram pagas
      const todasHospedagensPagas = !os.hospedagens || os.hospedagens.every((h: any) => h.statusPagamento === 'pago')
      const todosTransportesPagos = !os.transportes || os.transportes.every((t: any) => t.statusPagamento === 'pago')
      const todasAtividadesPagas = !os.atividades || os.atividades.every((a: any) => a.statusPagamento === 'pago')
      return todasHospedagensPagas && todosTransportesPagos && todasAtividadesPagas

    case 'checklist':
      // Verificar se o checklist JSON está completo
      return !!os.checklist

    case 'pagamentos':
      // Verificar se tem pelo menos um pagamento de entrada cadastrado
      return os.pagamentos && os.pagamentos.length > 0

    case 'vouchers':
    case 'briefing':
    case 'feedback':
    case 'relatorio':
    case 'relatorioFinanceiro':
    case 'avaliacao':
    case 'checkin':
      // Campos que ainda não existem no sistema - retornar true por enquanto
      return true

    default:
      return false
  }
}

/**
 * Obtém lista de todas as transições possíveis e suas validações
 */
export async function getAllTransitionsForOS(osId: string): Promise<Record<StatusOS, StatusTransitionValidation>> {
  const os = await prisma.oS.findUnique({
    where: { id: osId },
    select: { status: true },
  })

  if (!os) {
    throw new Error('OS não encontrada')
  }

  const currentStatus = os.status
  const allStatuses: StatusOS[] = [
    'planejamento',
    'cotacoes',
    'reservas_pendentes',
    'reservas_confirmadas',
    'documentacao',
    'pronto_para_viagem',
    'em_andamento',
    'concluida',
    'pos_viagem',
    'cancelada',
  ]

  const transitions: Record<string, StatusTransitionValidation> = {}

  for (const targetStatus of allStatuses) {
    if (targetStatus !== currentStatus) {
      try {
        const validation = await validateStatusTransition(osId, currentStatus, targetStatus)
        transitions[targetStatus] = validation
      } catch (error) {
        // Ignorar erros de validação
      }
    }
  }

  return transitions as Record<StatusOS, StatusTransitionValidation>
}
