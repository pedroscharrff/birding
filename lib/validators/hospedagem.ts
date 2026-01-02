import { z } from 'zod'

export const createHospedagemSchema = z.object({
  osId: z.string().uuid('ID da OS inválido'),
  fornecedorId: z.string().uuid('ID do fornecedor inválido'),
  tarifaId: z.string().uuid('ID da tarifa inválido').optional(),
  checkin: z.string().or(z.date()),
  checkout: z.string().or(z.date()),
  quartos: z.number().int().positive('Número de quartos deve ser positivo').optional(),
  tipoQuarto: z.string().optional(),
  regime: z.enum(['sem_cafe', 'cafe', 'meia_pensao', 'pensao_completa', 'all_inclusive']).optional(),
  custoTotal: z.number().positive('Custo deve ser positivo').optional(),
  moeda: z.enum(['BRL', 'USD', 'EUR']).default('BRL'),
  observacoes: z.string().optional(),
  reservasRefs: z.any().optional(),
})

export const updateHospedagemSchema = createHospedagemSchema.partial().omit({ osId: true })

export type CreateHospedagemInput = z.infer<typeof createHospedagemSchema>
export type UpdateHospedagemInput = z.infer<typeof updateHospedagemSchema>
