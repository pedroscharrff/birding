import { prisma } from '@/lib/db/prisma'

export type FinanceiroPolicy = {
  margemMinimaPercentual: number
  entradaMinimaPercentual: number
  toleranciaCustoRealAcimaEstimadoPercentual: number
}

export type PrazosPolicy = {
  prazoMinimoGuiaDias: number
  prazoMinimoMotoristaDias: number
  prazoMinimoHospedagemDias: number
}

export type ChecklistsOverrides = Record<string, unknown>

export type OrganizacaoPolicyInput = {
  orgId: string
  nome: string
  descricao?: string
  versao?: number
  ativa?: boolean
  financeiro?: Partial<FinanceiroPolicy>
  prazos?: Partial<PrazosPolicy>
  checklistsOverrides?: ChecklistsOverrides
}

export const DEFAULT_FINANCEIRO: FinanceiroPolicy = {
  margemMinimaPercentual: 15,
  entradaMinimaPercentual: 30,
  toleranciaCustoRealAcimaEstimadoPercentual: 20,
}

export const DEFAULT_PRAZOS: PrazosPolicy = {
  prazoMinimoGuiaDias: 15,
  prazoMinimoMotoristaDias: 10,
  prazoMinimoHospedagemDias: 7,
}

export async function getActivePolicy(orgId: string) {
  const current = await prisma.organizacaoPolicy.findFirst({
    where: { orgId, ativa: true },
    orderBy: { versao: 'desc' },
  })

  if (current) return current

  return {
    id: 'default',
    orgId,
    nome: 'Padrão',
    descricao: 'Política padrão do sistema',
    versao: 1,
    ativa: true,
    financeiro: DEFAULT_FINANCEIRO,
    prazos: DEFAULT_PRAZOS,
    checklists_overrides: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as any
}

export async function listPolicies(orgId: string) {
  return prisma.organizacaoPolicy.findMany({
    where: { orgId },
    orderBy: [{ ativa: 'desc' }, { versao: 'desc' }],
  })
}

export async function createPolicy(input: OrganizacaoPolicyInput) {
  const { orgId, nome, descricao } = input
  // próxima versão
  const last = await prisma.organizacaoPolicy.findFirst({
    where: { orgId },
    orderBy: { versao: 'desc' },
  })
  const versao = (last?.versao ?? 0) + 1

  return prisma.organizacaoPolicy.create({
    data: {
      orgId,
      nome,
      descricao,
      versao,
      ativa: false,
      financeiro: { ...DEFAULT_FINANCEIRO, ...(input.financeiro || {}) },
      prazos: { ...DEFAULT_PRAZOS, ...(input.prazos || {}) },
      checklistsOverrides: input.checklistsOverrides ? (input.checklistsOverrides as any) : undefined,
    },
  })
}

export async function updatePolicy(id: string, input: Partial<OrganizacaoPolicyInput>) {
  return prisma.organizacaoPolicy.update({
    where: { id },
    data: {
      nome: input.nome,
      descricao: input.descricao,
      financeiro: input.financeiro ? input.financeiro : undefined,
      prazos: input.prazos ? input.prazos : undefined,
      checklistsOverrides: input.checklistsOverrides ? (input.checklistsOverrides as any) : undefined,
    },
  })
}

export async function activatePolicy(orgId: string, id: string) {
  return prisma.$transaction([
    prisma.organizacaoPolicy.updateMany({ data: { ativa: false }, where: { orgId } }),
    prisma.organizacaoPolicy.update({ where: { id }, data: { ativa: true } }),
  ])
}

export async function snapshotPolicyForOS(osId: string, policyId: string) {
  const policy = await prisma.organizacaoPolicy.findUnique({ where: { id: policyId } })
  if (!policy) return null
  return prisma.oSPolicySnapshot.create({
    data: {
      osId,
      policyId,
      versao: policy.versao,
      snapshot: {
        financeiro: policy.financeiro,
        prazos: policy.prazos,
        checklistsOverrides: policy.checklistsOverrides ?? null,
      },
    },
  })
}
