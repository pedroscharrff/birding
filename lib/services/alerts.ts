/**
 * Serviço de Alertas Inteligentes
 * 
 * Gera alertas proativos baseados em regras de negócio
 * para prevenir erros e esquecimentos.
 */

import { prisma } from '@/lib/db/prisma'
import { Alert, AlertsResponse, ALERT_RULES } from '@/types/alerts'
import { addDays, isBefore, isAfter, differenceInDays } from 'date-fns'
import { getActivePolicy, FinanceiroPolicy, PrazosPolicy } from './policy'
import { contarGuiasFromData } from '@/lib/utils/guia-detection'

/**
 * Busca todos os alertas para uma organização
 */
export async function getAlertsForOrganization(orgId: string): Promise<AlertsResponse> {
  const alerts: Alert[] = []
  const hoje = new Date()

  // Buscar todas as OS ativas da organização - Otimizado
  const osList = await prisma.oS.findMany({
    where: {
      orgId,
      status: {
        notIn: ['concluida', 'pos_viagem', 'cancelada'],
      },
    },
    include: {
      participantes: {
        select: {
          id: true,
          nome: true,
          passaporteValidade: true,
        },
      },
      _count: {
        select: {
          hospedagens: true,
          transportes: true,
          atividades: true,
          passagensAereas: true,
        },
      },
      guiasDesignacao: {
        select: {
          id: true,
        },
      },
      motoristasDesignacao: {
        select: {
          id: true,
        },
      },
      fornecedores: {
        select: {
          id: true,
          categoria: true,
        },
      },
      pagamentos: {
        where: {
          status: 'pendente',
          dataVencimento: { lt: hoje },
        },
        select: {
          id: true,
          valor: true,
          dataVencimento: true,
          descricao: true,
          status: true,
        },
      },
    },
  })

  // Para cada OS, verificar regras de alerta
  for (const os of osList) {
    const diasAteInicio = differenceInDays(new Date(os.dataInicio), hoje)

    // ALERTA CRÍTICO: OS iniciando em menos de 48h
    if (diasAteInicio <= 2 && diasAteInicio >= 0 && os.status !== 'pronto_para_viagem') {
      alerts.push({
        id: `os-${os.id}-iniciando-sem-confirmacao`,
        ...ALERT_RULES.OS_INICIANDO_SEM_CONFIRMACAO,
        description: `A OS "${os.titulo}" inicia em ${diasAteInicio} dias e ainda não está pronta para viagem.`,
        osId: os.id,
        osTitulo: os.titulo,
        actionUrl: `/dashboard/os/${os.id}`,
        actionLabel: 'Ver OS',
        createdAt: hoje,
        metadata: {
          diasAteInicio,
        },
      })
    }

    // ALERTA CRÍTICO: Documentos de participantes vencidos
    for (const participante of os.participantes) {
      if (participante.passaporteValidade) {
        const passaporteVencido = isBefore(
          new Date(participante.passaporteValidade),
          hoje
        )
        if (passaporteVencido) {
          alerts.push({
            id: `participante-${participante.id}-documento-vencido`,
            ...ALERT_RULES.DOCUMENTO_VENCIDO,
            description: `O passaporte de ${participante.nome} está vencido na OS "${os.titulo}".`,
            osId: os.id,
            osTitulo: os.titulo,
            actionUrl: `/dashboard/os/${os.id}/participantes`,
            actionLabel: 'Ver Participantes',
            createdAt: hoje,
            metadata: {
              participanteNome: participante.nome,
              passaporteValidade: participante.passaporteValidade,
            },
          })
        }
      }
    }

    // ALERTA CRÍTICO: Pagamentos de cliente atrasados
    const pagamentosAtrasados = os.pagamentos.filter(p => {
      return (
        p.status === 'pendente' &&
        isBefore(new Date(p.dataVencimento), hoje)
      )
    })

    for (const pagamento of pagamentosAtrasados) {
      const diasAtraso = differenceInDays(hoje, new Date(pagamento.dataVencimento))
      alerts.push({
        id: `pagamento-${pagamento.id}-atrasado`,
        ...ALERT_RULES.PAGAMENTO_ATRASADO,
        description: `Pagamento de R$ ${pagamento.valor.toString()} está atrasado há ${diasAtraso} dias na OS "${os.titulo}".`,
        osId: os.id,
        osTitulo: os.titulo,
        actionUrl: `/dashboard/os/${os.id}/financeiro`,
        actionLabel: 'Ver Financeiro',
        createdAt: hoje,
        metadata: {
          valor: pagamento.valor,
          diasAtraso,
          descricao: pagamento.descricao,
        },
      })
    }

    // ✅ CORRIGIDO: ALERTA ATENÇÃO: OS sem guia designado (< 15 dias)
    // Verifica guias INTERNOS (designação) OU EXTERNOS (fornecedor tipo guiamento)
    const contadorGuias = contarGuiasFromData({
      guiasDesignacao: os.guiasDesignacao,
      fornecedores: os.fornecedores,
    })

    if (diasAteInicio <= 15 && diasAteInicio > 0 && contadorGuias.total === 0) {
      alerts.push({
        id: `os-${os.id}-sem-guia`,
        ...ALERT_RULES.OS_SEM_GUIA,
        description: `A OS "${os.titulo}" inicia em ${diasAteInicio} dias e ainda não tem guia designado (interno ou fornecedor).`,
        osId: os.id,
        osTitulo: os.titulo,
        actionUrl: `/dashboard/os/${os.id}`,
        actionLabel: 'Designar Guia',
        createdAt: hoje,
        metadata: {
          diasAteInicio,
        },
      })
    }

    // ALERTA ATENÇÃO: OS sem motorista designado (< 10 dias)
    if (diasAteInicio <= 10 && diasAteInicio > 0 && os.motoristasDesignacao.length === 0 && os._count.transportes > 0) {
      alerts.push({
        id: `os-${os.id}-sem-motorista`,
        ...ALERT_RULES.OS_SEM_MOTORISTA,
        description: `A OS "${os.titulo}" inicia em ${diasAteInicio} dias e ainda não tem motorista designado.`,
        osId: os.id,
        osTitulo: os.titulo,
        actionUrl: `/dashboard/os/${os.id}`,
        actionLabel: 'Designar Motorista',
        createdAt: hoje,
        metadata: {
          diasAteInicio,
        },
      })
    }

    // Alertas financeiros serão implementados quando os campos estiverem disponíveis no tipo
  }

  // Buscar despesas vencidas (todas as tabelas)
  const despesasVencidas = await buscarDespesasVencidas(orgId, hoje)
  alerts.push(...despesasVencidas)

  // Buscar despesas vencendo em 7 dias
  const despesasVencendo = await buscarDespesasVencendo(orgId, hoje)
  alerts.push(...despesasVencendo)

  // Contar alertas por severidade
  const count = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
    total: alerts.length,
  }

  // Ordenar: críticos primeiro, depois warnings, depois info
  const sortedAlerts = alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  return {
    alerts: sortedAlerts,
    count,
  }
}

/**
 * Busca despesas vencidas em todas as tabelas
 */
async function buscarDespesasVencidas(orgId: string, hoje: Date): Promise<Alert[]> {
  const alerts: Alert[] = []

  // Hospedagens vencidas
  const hospedagensVencidas = await prisma.hospedagem.findMany({
    where: {
      os: { orgId },
      statusPagamento: 'pendente',
      checkout: { lt: hoje },
    },
    include: {
      os: { select: { id: true, titulo: true } },
      fornecedor: { select: { nomeFantasia: true } },
    },
  })

  for (const hosp of hospedagensVencidas) {
    const diasAtraso = differenceInDays(hoje, new Date(hosp.checkout))
    alerts.push({
      id: `hospedagem-${hosp.id}-vencida`,
      ...ALERT_RULES.DESPESA_VENCIDA,
      description: `Hospedagem em ${hosp.fornecedor.nomeFantasia} está vencida há ${diasAtraso} dias (R$ ${hosp.custoTotal?.toString() || '0'}).`,
      osId: hosp.os.id,
      osTitulo: hosp.os.titulo,
      actionUrl: `/dashboard/os/${hosp.os.id}/financeiro`,
      actionLabel: 'Pagar Agora',
      createdAt: hoje,
      metadata: {
        tipo: 'hospedagem',
        fornecedor: hosp.fornecedor.nomeFantasia,
        valor: hosp.custoTotal,
        diasAtraso,
      },
    })
  }

  // Transportes vencidos
  const transportesVencidos = await prisma.transporte.findMany({
    where: {
      os: { orgId },
      statusPagamento: 'pendente',
      dataPartida: { lt: hoje },
    },
    include: {
      os: { select: { id: true, titulo: true } },
      fornecedor: { select: { nomeFantasia: true } },
    },
  })

  for (const transp of transportesVencidos) {
    if (transp.dataPartida) {
      const diasAtraso = differenceInDays(hoje, new Date(transp.dataPartida))
      alerts.push({
        id: `transporte-${transp.id}-vencido`,
        ...ALERT_RULES.DESPESA_VENCIDA,
        description: `Transporte com ${transp.fornecedor?.nomeFantasia || 'fornecedor'} está vencido há ${diasAtraso} dias (R$ ${transp.custo?.toString() || '0'}).`,
        osId: transp.os.id,
        osTitulo: transp.os.titulo,
        actionUrl: `/dashboard/os/${transp.os.id}/financeiro`,
        actionLabel: 'Pagar Agora',
        createdAt: hoje,
        metadata: {
          tipo: 'transporte',
          fornecedor: transp.fornecedor?.nomeFantasia,
          valor: transp.custo,
          diasAtraso,
        },
      })
    }
  }

  // Atividades vencidas
  const atividadesVencidas = await prisma.atividade.findMany({
    where: {
      os: { orgId },
      statusPagamento: 'pendente',
      data: { lt: hoje },
    },
    include: {
      os: { select: { id: true, titulo: true } },
      fornecedor: { select: { nomeFantasia: true } },
    },
  })

  for (const ativ of atividadesVencidas) {
    if (ativ.data) {
      const diasAtraso = differenceInDays(hoje, new Date(ativ.data))
      alerts.push({
        id: `atividade-${ativ.id}-vencida`,
        ...ALERT_RULES.DESPESA_VENCIDA,
        description: `Atividade "${ativ.nome}" está vencida há ${diasAtraso} dias (R$ ${ativ.valor?.toString() || '0'}).`,
        osId: ativ.os.id,
        osTitulo: ativ.os.titulo,
        actionUrl: `/dashboard/os/${ativ.os.id}/financeiro`,
        actionLabel: 'Pagar Agora',
        createdAt: hoje,
        metadata: {
          tipo: 'atividade',
          nome: ativ.nome,
          fornecedor: ativ.fornecedor?.nomeFantasia,
          valor: ativ.valor,
          diasAtraso,
        },
      })
    }
  }

  return alerts
}

/**
 * Busca despesas vencendo em 7 dias
 */
async function buscarDespesasVencendo(orgId: string, hoje: Date): Promise<Alert[]> {
  const alerts: Alert[] = []
  const seteDiasDepois = addDays(hoje, 7)

  // Hospedagens vencendo
  const hospedagensVencendo = await prisma.hospedagem.findMany({
    where: {
      os: { orgId },
      statusPagamento: 'pendente',
      checkout: {
        gte: hoje,
        lte: seteDiasDepois,
      },
    },
    include: {
      os: { select: { id: true, titulo: true } },
      fornecedor: { select: { nomeFantasia: true } },
    },
  })

  for (const hosp of hospedagensVencendo) {
    const diasRestantes = differenceInDays(new Date(hosp.checkout), hoje)
    alerts.push({
      id: `hospedagem-${hosp.id}-vencendo`,
      ...ALERT_RULES.DESPESA_VENCENDO,
      description: `Hospedagem em ${hosp.fornecedor.nomeFantasia} vence em ${diasRestantes} dias (R$ ${hosp.custoTotal?.toString() || '0'}).`,
      osId: hosp.os.id,
      osTitulo: hosp.os.titulo,
      actionUrl: `/dashboard/os/${hosp.os.id}/financeiro`,
      actionLabel: 'Ver Detalhes',
      createdAt: hoje,
      metadata: {
        tipo: 'hospedagem',
        fornecedor: hosp.fornecedor.nomeFantasia,
        valor: hosp.custoTotal,
        diasRestantes,
      },
    })
  }

  return alerts
}

/**
 * Busca alertas para uma OS específica
 */
export async function getAlertsForOS(osId: string): Promise<Alert[]> {
  const os = await prisma.oS.findUnique({
    where: { id: osId },
    select: { orgId: true },
  })

  if (!os) {
    return []
  }

  const allAlerts = await getAlertsForOrganization(os.orgId)
  return allAlerts.alerts.filter(alert => alert.osId === osId)
}
