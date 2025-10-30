import { z } from 'zod'

export const createOSSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  destino: z.string().min(2, 'Destino é obrigatório'),
  dataInicio: z.string().or(z.date()),
  dataFim: z.string().or(z.date()),
  status: z.enum([
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
  ]).default('planejamento'),
  agenteResponsavelId: z.string().uuid('ID do agente inválido'),
  descricao: z.string().optional(),
  checklist: z.record(z.any()).optional(),
})

export const updateOSSchema = createOSSchema.partial()

export const updateOSStatusSchema = z.object({
  status: z.enum([
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
  ]),
  motivo: z.string().optional(),
})

export const listOSQuerySchema = z.object({
  status: z.string().optional(),
  agente: z.string().uuid().optional(),
  destino: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
})

export type CreateOSInput = z.infer<typeof createOSSchema>
export type UpdateOSInput = z.infer<typeof updateOSSchema>
export type UpdateOSStatusInput = z.infer<typeof updateOSStatusSchema>
export type ListOSQuery = z.infer<typeof listOSQuerySchema>
