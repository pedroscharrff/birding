import { z } from 'zod'

export const createAtividadeSchema = z.object({
  osId: z.string().uuid('ID da OS inválido'),
  tipo: z.enum(['atividade', 'alimentacao']).default('atividade'),
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  valor: z.number().positive('Valor deve ser positivo').optional(),
  moeda: z.enum(['BRL', 'USD', 'EUR']).default('BRL'),
  localizacao: z.string().optional(),
  quantidadeMaxima: z.number().int().positive().optional(),
  data: z.string().or(z.date()).optional(),
  hora: z.string().optional(),
  fornecedorId: z.string().uuid('ID do fornecedor inválido').optional(),
  notas: z.string().optional(),
})

export const updateAtividadeSchema = createAtividadeSchema.partial().omit({ osId: true })

export type CreateAtividadeInput = z.infer<typeof createAtividadeSchema>
export type UpdateAtividadeInput = z.infer<typeof updateAtividadeSchema>
