import { z } from 'zod'

// Schema para arquivo uploadado
const uploadedFileSchema = z.object({
  url: z.string(),
  key: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
})

export const createParticipanteSchema = z.object({
  osId: z.string().uuid('ID da OS inválido'),
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  passaporteNumero: z.string().optional(),
  passaporteValidade: z.string().or(z.date()).optional(),
  alergias: z.string().optional(),
  restricoes: z.string().optional(),
  preferencias: z.string().optional(),
  idade: z.number().int().positive().optional(),
  observacoes: z.string().optional(),
  documentos: z.array(uploadedFileSchema).optional(),
})

export const updateParticipanteSchema = createParticipanteSchema.partial().omit({ osId: true })

export type CreateParticipanteInput = z.infer<typeof createParticipanteSchema>
export type UpdateParticipanteInput = z.infer<typeof updateParticipanteSchema>
