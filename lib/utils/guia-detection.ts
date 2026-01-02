/**
 * Utilitário para detectar presença de guias em uma OS
 *
 * Unifica a detecção de guias considerando AMBOS:
 * - Guias internos (designação via guiasDesignacao)
 * - Guias externos (fornecedores tipo "guiamento")
 */

import { prisma } from '@/lib/db/prisma'

export interface GuiaDetectionResult {
  temGuia: boolean
  guiasInternos: number
  guiasExternos: number
  total: number
  detalhes: {
    internos: Array<{
      id: string
      nome: string
      tipo: 'interno'
      funcao?: string | null
    }>
    externos: Array<{
      id: string
      nome: string
      tipo: 'externo'
      fornecedorId: string
    }>
  }
}

/**
 * Detecta se uma OS tem guias designados (internos OU externos)
 */
export async function detectarGuiasNaOS(osId: string): Promise<GuiaDetectionResult> {
  // Buscar guias internos (designações)
  const guiasInternos = await prisma.guiaDesignacao.findMany({
    where: { osId },
    include: {
      guia: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  })

  // Buscar guias externos (fornecedores tipo "guiamento")
  const guiasExternos = await prisma.oSFornecedor.findMany({
    where: {
      osId,
      categoria: 'guiamento',
    },
    include: {
      fornecedor: {
        select: {
          id: true,
          nomeFantasia: true,
        },
      },
    },
  })

  const totalInternos = guiasInternos.length
  const totalExternos = guiasExternos.length
  const total = totalInternos + totalExternos

  return {
    temGuia: total > 0,
    guiasInternos: totalInternos,
    guiasExternos: totalExternos,
    total,
    detalhes: {
      internos: guiasInternos.map(g => ({
        id: g.id,
        nome: g.guia.nome,
        tipo: 'interno' as const,
        funcao: g.funcao,
      })),
      externos: guiasExternos.map(g => ({
        id: g.id,
        nome: g.fornecedor.nomeFantasia,
        tipo: 'externo' as const,
        fornecedorId: g.fornecedorId,
      })),
    },
  }
}

/**
 * Versão simplificada - retorna apenas booleano
 */
export async function osTemGuia(osId: string): Promise<boolean> {
  const resultado = await detectarGuiasNaOS(osId)
  return resultado.temGuia
}

/**
 * Detecta guias a partir de dados já carregados (para evitar queries extras)
 */
export function detectarGuiasFromData(data: {
  guiasDesignacao?: any[]
  fornecedores?: Array<{ categoria: string }>
}): boolean {
  const temGuiaInterno = (data.guiasDesignacao?.length || 0) > 0
  const temGuiaExterno = (data.fornecedores?.filter(f => f.categoria === 'guiamento').length || 0) > 0

  return temGuiaInterno || temGuiaExterno
}

/**
 * Conta total de guias a partir de dados já carregados
 */
export function contarGuiasFromData(data: {
  guiasDesignacao?: any[]
  fornecedores?: Array<{ categoria: string }>
}): {
  internos: number
  externos: number
  total: number
} {
  const internos = data.guiasDesignacao?.length || 0
  const externos = data.fornecedores?.filter(f => f.categoria === 'guiamento').length || 0

  return {
    internos,
    externos,
    total: internos + externos,
  }
}
