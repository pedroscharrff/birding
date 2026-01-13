import { z } from 'zod'

const tipoLancamentoSchema = z.enum([
  'entrada',
  'saida',
  'adiantamento',
  'ajuste',
  'receita_os',
  'comissao',
])

const categoriaLancamentoSchema = z.enum([
  'hospedagem',
  'guiamento',
  'transporte',
  'alimentacao',
  'atividade',
  'taxa',
  'passagem_aerea',
  'despesa_guia',
  'despesa_motorista',
  'receita_tour',
  'comissao_agente',
  'comissao_guia',
  'reembolso',
  'cancelamento',
  'outros',
])

export const createLancamentoSchema = z.object({
  osId: z.string().uuid().optional(),
  referenciaUsuarioId: z.string().uuid().optional(),
  fornecedorId: z.string().uuid().optional(),
  tipo: tipoLancamentoSchema,
  categoria: categoriaLancamentoSchema,
  valor: z.number().positive('Valor deve ser positivo'),
  moeda: z.enum(['BRL', 'USD', 'EUR']).default('BRL'),
  data: z.string().or(z.date()),
  observacao: z.string().optional(),
  comprovanteUrl: z.string().url().optional(),
})

export const updateLancamentoSchema = createLancamentoSchema.partial()

export const listLancamentosQuerySchema = z.object({
  osId: z.string().uuid().optional(),
  categoria: categoriaLancamentoSchema.optional(),
  tipo: tipoLancamentoSchema.optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
})

export type CreateLancamentoInput = z.infer<typeof createLancamentoSchema>
export type UpdateLancamentoInput = z.infer<typeof updateLancamentoSchema>
export type ListLancamentosQuery = z.infer<typeof listLancamentosQuerySchema>
