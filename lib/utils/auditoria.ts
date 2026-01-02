/**
 * Utilitários para sistema de auditoria
 *
 * Funções auxiliares para:
 * - Comparar objetos e identificar campos alterados
 * - Gerar descrições legíveis de ações
 * - Sanitizar dados sensíveis
 * - Formatar dados para exibição
 */

import type { CampoAlterado } from '@/types'

/**
 * Campos que devem ser ocultados nos logs de auditoria
 */
const SENSITIVE_FIELDS = [
  'senha',
  'password',
  'hashSenha',
  'hash_senha',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'creditCard',
  'cvv',
]

/**
 * Campos que devem ser ignorados na comparação
 */
const IGNORED_FIELDS = [
  'updatedAt',
  'updated_at',
  'createdAt',
  'created_at',
]

/**
 * Verifica se um campo é sensível
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.some(sensitive =>
    fieldName.toLowerCase().includes(sensitive.toLowerCase())
  )
}

/**
 * Verifica se um campo deve ser ignorado
 */
function isIgnoredField(fieldName: string): boolean {
  return IGNORED_FIELDS.includes(fieldName)
}

/**
 * Sanitiza um valor, ocultando dados sensíveis
 */
function sanitizeValue(fieldName: string, value: any): any {
  if (value === null || value === undefined) {
    return value
  }

  if (isSensitiveField(fieldName)) {
    return '***REDACTED***'
  }

  return value
}

/**
 * Compara dois objetos e retorna os campos que foram alterados
 */
export function identificarCamposAlterados(
  dadosAntigos: any,
  dadosNovos: any
): string[] {
  if (!dadosAntigos && !dadosNovos) return []
  if (!dadosAntigos) return Object.keys(dadosNovos || {})
  if (!dadosNovos) return []

  const campos: string[] = []
  const allKeys = new Set([
    ...Object.keys(dadosAntigos),
    ...Object.keys(dadosNovos),
  ])

  for (const key of allKeys) {
    if (isIgnoredField(key)) continue

    const valorAntigo = dadosAntigos[key]
    const valorNovo = dadosNovos[key]

    // Comparação profunda para objetos simples
    if (JSON.stringify(valorAntigo) !== JSON.stringify(valorNovo)) {
      campos.push(key)
    }
  }

  return campos
}

/**
 * Obtém detalhes dos campos alterados com valores antes/depois
 */
export function obterDetalhesAlteracoes(
  dadosAntigos: any,
  dadosNovos: any
): CampoAlterado[] {
  if (!dadosAntigos || !dadosNovos) return []

  const campos = identificarCamposAlterados(dadosAntigos, dadosNovos)

  return campos.map(campo => ({
    campo,
    valorAntigo: sanitizeValue(campo, dadosAntigos[campo]),
    valorNovo: sanitizeValue(campo, dadosNovos[campo]),
  }))
}

/**
 * Sanitiza um objeto completo, removendo campos sensíveis
 */
export function sanitizarDados(dados: any): any {
  if (!dados || typeof dados !== 'object') {
    return dados
  }

  if (Array.isArray(dados)) {
    return dados.map(item => sanitizarDados(item))
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(dados)) {
    sanitized[key] = sanitizeValue(key, value)
  }

  return sanitized
}

/**
 * Gera uma descrição legível para uma ação de auditoria
 */
export function gerarDescricaoAuditoria(params: {
  acao: string
  entidade: string
  dados?: any
  campos?: string[]
}): string {
  const { acao, entidade, dados, campos } = params

  const entidadeNome = traduzirEntidade(entidade)
  const acaoVerbo = traduzirAcao(acao)

  switch (acao) {
    case 'criar':
      return `${acaoVerbo} ${entidadeNome}${dados?.nome || dados?.titulo ? `: ${dados.nome || dados.titulo}` : ''}`

    case 'atualizar':
      if (campos && campos.length > 0) {
        const camposTraduzidos = campos.map(c => traduzirCampo(c)).join(', ')
        return `${acaoVerbo} ${entidadeNome} (campos: ${camposTraduzidos})`
      }
      return `${acaoVerbo} ${entidadeNome}`

    case 'excluir':
      return `${acaoVerbo} ${entidadeNome}${dados?.nome || dados?.titulo ? `: ${dados.nome || dados.titulo}` : ''}`

    case 'status_alterado':
      return `${acaoVerbo} status de ${entidadeNome}${dados?.de && dados?.para ? ` de "${dados.de}" para "${dados.para}"` : ''}`

    case 'visualizar':
      return `${acaoVerbo} ${entidadeNome}`

    case 'exportar':
      return `${acaoVerbo} ${entidadeNome}`

    default:
      return `${acaoVerbo} ${entidadeNome}`
  }
}

/**
 * Traduz a ação para português
 */
function traduzirAcao(acao: string): string {
  const traducoes: Record<string, string> = {
    criar: 'Criou',
    atualizar: 'Atualizou',
    excluir: 'Excluiu',
    visualizar: 'Visualizou',
    exportar: 'Exportou',
    status_alterado: 'Alterou',
  }
  return traducoes[acao] || acao
}

/**
 * Traduz a entidade para português
 */
function traduzirEntidade(entidade: string): string {
  const traducoes: Record<string, string> = {
    os: 'OS',
    participante: 'participante',
    fornecedor_os: 'fornecedor da OS',
    atividade: 'atividade',
    hospedagem: 'hospedagem',
    transporte: 'transporte',
    passagem_aerea: 'passagem aérea',
    guia_designacao: 'designação de guia',
    motorista_designacao: 'designação de motorista',
    scouting: 'scouting',
    lancamento_financeiro: 'lançamento financeiro',
    anotacao: 'anotação',
  }
  return traducoes[entidade] || entidade
}

/**
 * Traduz nome de campo para português
 */
function traduzirCampo(campo: string): string {
  const traducoes: Record<string, string> = {
    nome: 'nome',
    email: 'e-mail',
    telefone: 'telefone',
    titulo: 'título',
    descricao: 'descrição',
    status: 'status',
    dataInicio: 'data de início',
    data_inicio: 'data de início',
    dataFim: 'data de fim',
    data_fim: 'data de fim',
    valor: 'valor',
    custo: 'custo',
    custoTotal: 'custo total',
    custo_total: 'custo total',
    observacoes: 'observações',
    destino: 'destino',
    origem: 'origem',
    checkin: 'check-in',
    checkout: 'check-out',
    hotelNome: 'nome do hotel',
    hotel_nome: 'nome do hotel',
    passaporteNumero: 'número do passaporte',
    passaporte_numero: 'número do passaporte',
    alergias: 'alergias',
    restricoes: 'restrições',
    preferencias: 'preferências',
    idade: 'idade',
  }
  return traducoes[campo] || campo
}

/**
 * Formata uma data para exibição
 */
export function formatarDataAuditoria(data: Date | string): string {
  const date = typeof data === 'string' ? new Date(data) : data

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // Há menos de 1 minuto
  if (diffMinutes < 1) {
    return 'Agora mesmo'
  }

  // Há menos de 1 hora
  if (diffMinutes < 60) {
    return `Há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`
  }

  // Há menos de 24 horas
  if (diffHours < 24) {
    return `Há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  }

  // Há menos de 7 dias
  if (diffDays < 7) {
    return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
  }

  // Formato completo
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formata um valor para exibição (trata tipos especiais)
 */
export function formatarValorAuditoria(valor: any): string {
  if (valor === null || valor === undefined) {
    return '—'
  }

  if (typeof valor === 'boolean') {
    return valor ? 'Sim' : 'Não'
  }

  if (typeof valor === 'number') {
    return valor.toLocaleString('pt-BR')
  }

  if (valor instanceof Date) {
    return valor.toLocaleString('pt-BR')
  }

  if (Array.isArray(valor)) {
    return valor.join(', ')
  }

  if (typeof valor === 'object') {
    return JSON.stringify(valor, null, 2)
  }

  return String(valor)
}

/**
 * Extrai informações de metadata de uma requisição
 */
export function extrairMetadataRequisicao(request: Request): {
  ip?: string
  userAgent?: string
  method: string
  url: string
} {
  const headers = request.headers

  return {
    ip: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
    userAgent: headers.get('user-agent') || undefined,
    method: request.method,
    url: request.url,
  }
}

/**
 * Cria um identificador único para lock/deduplicação
 */
export function criarIdLock(params: {
  osId: string
  entidade: string
  entidadeId?: string
  timestamp?: number
}): string {
  const { osId, entidade, entidadeId, timestamp = Date.now() } = params
  const roundedTimestamp = Math.floor(timestamp / 1000) // Arredonda para segundo
  return `${osId}:${entidade}:${entidadeId || 'null'}:${roundedTimestamp}`
}
