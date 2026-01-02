import { z } from 'zod'

export const presetTipoEnum = z.enum(['alergia', 'restricao', 'preferencia'])

export const createPresetCategorySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: presetTipoEnum,
  parentId: z.string().uuid().optional(),
  ordem: z.number().int().min(0).optional(),
  ativo: z.boolean().optional(),
})

export const updatePresetCategorySchema = createPresetCategorySchema.partial()

export type CreatePresetCategoryInput = z.infer<typeof createPresetCategorySchema>
export type UpdatePresetCategoryInput = z.infer<typeof updatePresetCategorySchema>

export const createPresetItemSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  tipo: presetTipoEnum,
  categoriaId: z.string().uuid().optional(),
  descricao: z.string().optional(),
  ordem: z.number().int().min(0).optional(),
  ativo: z.boolean().optional(),
})

export const updatePresetItemSchema = createPresetItemSchema.partial()

export type CreatePresetItemInput = z.infer<typeof createPresetItemSchema>
export type UpdatePresetItemInput = z.infer<typeof updatePresetItemSchema>

// Templates
export const createPresetTemplateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: presetTipoEnum,
  descricao: z.string().optional(),
  itemIds: z.array(z.string().uuid()).min(1, 'Pelo menos um item é obrigatório'),
  ativo: z.boolean().optional(),
})

export const updatePresetTemplateSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  itemIds: z.array(z.string().uuid()).min(1).optional(),
  ativo: z.boolean().optional(),
})

export type CreatePresetTemplateInput = z.infer<typeof createPresetTemplateSchema>
export type UpdatePresetTemplateInput = z.infer<typeof updatePresetTemplateSchema>

// Track usage
export const trackPresetUsageSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1, 'Pelo menos um item é obrigatório'),
})
