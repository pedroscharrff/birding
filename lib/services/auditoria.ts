/**
 * Service de Auditoria com Redis Cache
 *
 * Este service gerencia o sistema de auditoria completo:
 * - Registro de ações no PostgreSQL
 * - Cache de logs recentes no Redis (últimas 24h)
 * - Estatísticas agregadas em tempo real
 * - Consultas otimizadas com fallback
 */

import { prisma } from '@/lib/db/prisma'
import { getRedisClient, AUDIT_CACHE_KEYS, AUDIT_CACHE_TTL } from '@/lib/cache/redis'
import {
  identificarCamposAlterados,
  gerarDescricaoAuditoria,
  sanitizarDados,
  criarIdLock,
} from '@/lib/utils/auditoria'
import type {
  LogAuditoriaParams,
  AuditoriaFilters,
  AuditoriaComUsuario,
  AuditoriaResumida,
} from '@/types'
import type { AuditoriaOS, RoleGlobal } from '@prisma/client'

/**
 * Registra uma ação de auditoria
 *
 * Fluxo:
 * 1. Valida e prepara os dados
 * 2. Salva no PostgreSQL
 * 3. Atualiza cache no Redis (logs recentes + estatísticas)
 */
export async function logAuditoria(params: LogAuditoriaParams): Promise<AuditoriaOS> {
  const redis = getRedisClient()

  // 1. Buscar dados do usuário
  const usuario = await prisma.usuario.findUnique({
    where: { id: params.usuarioId },
    select: {
      nome: true,
      roleGlobal: true,
      orgId: true,
    },
  })

  if (!usuario) {
    throw new Error(`Usuário ${params.usuarioId} não encontrado`)
  }

  // 2. Identificar campos alterados
  const campos = identificarCamposAlterados(
    params.dadosAntigos,
    params.dadosNovos
  )

  // 3. Sanitizar dados sensíveis
  const dadosAntigosSanitizados = sanitizarDados(params.dadosAntigos)
  const dadosNovosSanitizados = sanitizarDados(params.dadosNovos)

  // 4. Gerar descrição automática se não fornecida
  const descricao =
    params.descricao ||
    gerarDescricaoAuditoria({
      acao: params.acao,
      entidade: params.entidade,
      dados: params.dadosNovos || params.dadosAntigos,
      campos,
    })

  // 5. Verificar lock para prevenir duplicação
  const lockId = criarIdLock({
    osId: params.osId,
    entidade: params.entidade,
    entidadeId: params.entidadeId,
  })
  const lockKey = AUDIT_CACHE_KEYS.lock(lockId)
  const lockExists = await redis.exists(lockKey)

  if (lockExists) {
    console.warn('[Auditoria] Lock detectado, pulando log duplicado:', lockId)
    // Retorna o último log similar (não ideal, mas evita erro)
    const existingLog = await prisma.auditoriaOS.findFirst({
      where: {
        osId: params.osId,
        entidade: params.entidade as any,
        entidadeId: params.entidadeId,
      },
      orderBy: { createdAt: 'desc' },
    })
    if (existingLog) return existingLog
  }

  // 6. Criar lock temporário
  await redis.setex(lockKey, AUDIT_CACHE_TTL.lock, '1')

  // 7. Criar log de auditoria no PostgreSQL
  const auditLog = await prisma.auditoriaOS.create({
    data: {
      orgId: usuario.orgId,
      osId: params.osId,
      usuarioId: params.usuarioId,
      usuarioNome: usuario.nome,
      usuarioRole: usuario.roleGlobal,
      acao: params.acao as any,
      entidade: params.entidade as any,
      entidadeId: params.entidadeId,
      dadosAntigos: dadosAntigosSanitizados,
      dadosNovos: dadosNovosSanitizados,
      campos,
      descricao,
      metadata: params.metadata,
    },
  })

  // 8. Atualizar cache no Redis (não-bloqueante)
  atualizarCacheAuditoria(params.osId, auditLog, usuario).catch(error => {
    console.error('[Auditoria] Erro ao atualizar cache:', error)
    // Não falha a operação se cache falhar
  })

  return auditLog
}

/**
 * Atualiza cache no Redis com novo log de auditoria
 */
async function atualizarCacheAuditoria(
  osId: string,
  auditLog: AuditoriaOS,
  usuario: { nome: string; roleGlobal: RoleGlobal }
) {
  const redis = getRedisClient()

  try {
    // 1. Adicionar à lista de logs recentes (FIFO limitada a 100)
    const recentKey = AUDIT_CACHE_KEYS.recentLogs(osId)
    await redis.lpush(recentKey, JSON.stringify(auditLog))
    await redis.ltrim(recentKey, 0, 99) // Manter apenas 100 mais recentes
    await redis.expire(recentKey, AUDIT_CACHE_TTL.recentLogs)

    // 2. Incrementar contador de ações do usuário
    const userKey = AUDIT_CACHE_KEYS.userActions(osId)
    await redis.zincrby(userKey, 1, `${auditLog.usuarioId}:${usuario.nome}`)
    await redis.expire(userKey, AUDIT_CACHE_TTL.counters)

    // 3. Incrementar contador de ações por entidade
    const entityKey = AUDIT_CACHE_KEYS.entityActions(osId)
    await redis.zincrby(entityKey, 1, auditLog.entidade)
    await redis.expire(entityKey, AUDIT_CACHE_TTL.counters)

    // 4. Invalidar cache de estatísticas
    const statsKey = AUDIT_CACHE_KEYS.stats(osId)
    await redis.del(statsKey)
  } catch (error) {
    console.error('[Auditoria] Erro ao atualizar cache Redis:', error)
    // Não propaga erro - cache é opcional
  }
}

/**
 * Busca logs de auditoria com filtros
 *
 * Usa cache do Redis para logs recentes, fallback para PostgreSQL
 */
export async function buscarAuditorias(
  filters: AuditoriaFilters
): Promise<{ data: AuditoriaComUsuario[]; total: number; fromCache: boolean }> {
  const { osId, page = 1, limit = 50, ...otherFilters } = filters

  if (!osId) {
    throw new Error('osId é obrigatório')
  }

  // Tentar buscar do cache se:
  // - Não há filtros adicionais
  // - Está na primeira página
  // - Limit é <= 100
  const canUseCache =
    Object.keys(otherFilters).length === 0 &&
    page === 1 &&
    limit <= 100

  if (canUseCache) {
    try {
      const cached = await buscarAuditoriasCache(osId, limit)
      if (cached.length > 0) {
        return {
          data: cached as AuditoriaComUsuario[],
          total: cached.length,
          fromCache: true,
        }
      }
    } catch (error) {
      console.error('[Auditoria] Erro ao buscar do cache, usando DB:', error)
    }
  }

  // Fallback para PostgreSQL
  return buscarAuditoriasDB(filters)
}

/**
 * Busca auditorias do cache Redis
 */
async function buscarAuditoriasCache(
  osId: string,
  limit: number
): Promise<AuditoriaOS[]> {
  const redis = getRedisClient()
  const key = AUDIT_CACHE_KEYS.recentLogs(osId)

  const logs = await redis.lrange(key, 0, limit - 1)

  return logs.map(log => JSON.parse(log))
}

/**
 * Busca auditorias do PostgreSQL
 */
async function buscarAuditoriasDB(
  filters: AuditoriaFilters
): Promise<{ data: AuditoriaComUsuario[]; total: number; fromCache: false }> {
  const {
    osId,
    usuarioId,
    acao,
    entidade,
    entidadeId,
    dataInicio,
    dataFim,
    page = 1,
    limit = 50,
  } = filters

  // Construir WHERE
  const where: any = {}

  if (osId) where.osId = osId
  if (usuarioId) where.usuarioId = usuarioId
  if (acao) where.acao = acao
  if (entidade) where.entidade = entidade
  if (entidadeId) where.entidadeId = entidadeId

  if (dataInicio || dataFim) {
    where.createdAt = {}
    if (dataInicio) where.createdAt.gte = new Date(dataInicio)
    if (dataFim) where.createdAt.lte = new Date(dataFim)
  }

  // Buscar total e dados
  const [total, data] = await Promise.all([
    prisma.auditoriaOS.count({ where }),
    prisma.auditoriaOS.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            roleGlobal: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return {
    data: data as AuditoriaComUsuario[],
    total,
    fromCache: false,
  }
}

/**
 * Busca estatísticas de auditoria de uma OS
 *
 * Usa cache Redis quando possível
 */
export async function buscarEstatisticasAuditoria(
  osId: string
): Promise<AuditoriaResumida> {
  const redis = getRedisClient()
  const statsKey = AUDIT_CACHE_KEYS.stats(osId)

  // Tentar buscar do cache
  try {
    const cached = await redis.get(statsKey)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('[Auditoria] Erro ao buscar stats do cache:', error)
  }

  // Calcular estatísticas do DB
  const stats = await calcularEstatisticasDB(osId)

  // Salvar no cache (não-bloqueante)
  redis
    .setex(statsKey, AUDIT_CACHE_TTL.stats, JSON.stringify(stats))
    .catch(error => {
      console.error('[Auditoria] Erro ao salvar stats no cache:', error)
    })

  return stats
}

/**
 * Calcula estatísticas do PostgreSQL
 */
async function calcularEstatisticasDB(osId: string): Promise<AuditoriaResumida> {
  const agora = new Date()
  const ultimas24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000)

  const [totalAcoes, acoesUltimas24h, usuariosMaisAtivos, entidadesMaisAlteradas] =
    await Promise.all([
      // Total de ações
      prisma.auditoriaOS.count({
        where: { osId },
      }),

      // Ações nas últimas 24h
      prisma.auditoriaOS.count({
        where: {
          osId,
          createdAt: { gte: ultimas24h },
        },
      }),

      // Usuários mais ativos
      prisma.auditoriaOS.groupBy({
        by: ['usuarioId', 'usuarioNome'],
        where: { osId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),

      // Entidades mais alteradas
      prisma.auditoriaOS.groupBy({
        by: ['entidade'],
        where: { osId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ])

  return {
    totalAcoes,
    acoesUltimas24h,
    usuariosMaisAtivos: usuariosMaisAtivos.map(u => ({
      usuarioId: u.usuarioId,
      usuarioNome: u.usuarioNome,
      quantidade: u._count.id,
    })),
    entidadesMaisAlteradas: entidadesMaisAlteradas.map(e => ({
      entidade: e.entidade,
      quantidade: e._count.id,
    })),
  }
}

/**
 * Busca um log de auditoria específico por ID
 */
export async function buscarAuditoriaPorId(
  id: string
): Promise<AuditoriaComUsuario | null> {
  const auditoria = await prisma.auditoriaOS.findUnique({
    where: { id },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          roleGlobal: true,
        },
      },
    },
  })

  return auditoria as AuditoriaComUsuario | null
}

/**
 * Limpa cache de auditoria de uma OS
 */
export async function limparCacheAuditoria(osId: string): Promise<void> {
  const redis = getRedisClient()

  try {
    await Promise.all([
      redis.del(AUDIT_CACHE_KEYS.recentLogs(osId)),
      redis.del(AUDIT_CACHE_KEYS.stats(osId)),
      redis.del(AUDIT_CACHE_KEYS.userActions(osId)),
      redis.del(AUDIT_CACHE_KEYS.entityActions(osId)),
    ])
    console.log(`[Auditoria] Cache limpo para OS ${osId}`)
  } catch (error) {
    console.error('[Auditoria] Erro ao limpar cache:', error)
  }
}

/**
 * Exporta logs de auditoria em formato JSON
 */
export async function exportarAuditoria(
  filters: AuditoriaFilters
): Promise<AuditoriaComUsuario[]> {
  // Remove paginação para exportação completa
  const { page, limit, ...filtersSemPaginacao } = filters

  const { data } = await buscarAuditoriasDB({
    ...filtersSemPaginacao,
    page: 1,
    limit: 10000, // Limite máximo para exportação
  })

  return data
}
