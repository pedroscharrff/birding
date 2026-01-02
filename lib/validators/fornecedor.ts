import { z } from 'zod'

export const tipoFornecedorEnum = z.enum([
  'hotelaria',
  'guiamento',
  'transporte',
  'alimentacao',
  'atividade',
  'outros'
])

export const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().optional(),
}).optional()

export const createFornecedorSchema = z.object({
  nomeFantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  razaoSocial: z.string().optional(),
  tipo: tipoFornecedorEnum,
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  documento: z.string().optional(),
  endereco: enderecoSchema,
  obs: z.string().optional(),
})

export const updateFornecedorSchema = z.object({
  nomeFantasia: z.string().min(1, 'Nome fantasia é obrigatório').optional(),
  razaoSocial: z.string().optional(),
  tipo: tipoFornecedorEnum.optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  documento: z.string().optional(),
  endereco: enderecoSchema,
  obs: z.string().optional(),
})

export type CreateFornecedorInput = z.infer<typeof createFornecedorSchema>
export type UpdateFornecedorInput = z.infer<typeof updateFornecedorSchema>
export type TipoFornecedor = z.infer<typeof tipoFornecedorEnum>
