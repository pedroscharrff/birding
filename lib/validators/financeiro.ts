import { z } from 'zod'

export const createLancamentoSchema = z.object({
  osId: z.string().uuid().optional(),
  referenciaUsuarioId: z.string().uuid().optional(),
  fornecedorId: z.string().uuid().optional(),
  tipo: z.enum(['entrada', 'saida', 'adiantamento', 'ajuste']),
  categoria: z.enum([
    'hospedagem',
    'guiamento',
    'transporte',
    'alimentacao',
    'atividade',
    'taxa',
    'passagem_aerea',
    'despesa_guia',
    'despesa_motorista',
    'outros',
  ]),
  valor: z.number().positive('Valor deve ser positivo'),
  moeda: z.enum(['BRL', 'USD', 'EUR']).default('BRL'),
  data: z.string().or(z.date()),
  observacao: z.string().optional(),
  comprovanteUrl: z.string().url().optional(),
})

export const updateLancamentoSchema = createLancamentoSchema.partial()

export const listLancamentosQuerySchema = z.object({
  osId: z.string().uuid().optional(),
  categoria: z.string().optional(),
  tipo: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
})

export type CreateLancamentoInput = z.infer<typeof createLancamentoSchema>
export type UpdateLancamentoInput = z.infer<typeof updateLancamentoSchema>
export type ListLancamentosQuery = z.infer<typeof listLancamentosQuerySchema>
