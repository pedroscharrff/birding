# Sistema de Auditoria - Fase 1 (Fundação) ✅

## Resumo da Implementação

A Fase 1 do sistema de auditoria foi concluída com sucesso! Agora temos uma infraestrutura completa para rastrear todas as ações realizadas nas Ordens de Serviço (OS).

---

## O que foi implementado

### 1. Schema Prisma de Auditoria ✅

**Localização:** `prisma/schema.prisma`

**Enums criados:**
- `AcaoAuditoria`: criar, atualizar, excluir, visualizar, exportar, status_alterado
- `EntidadeAuditoria`: os, participante, fornecedor_os, atividade, hospedagem, transporte, passagem_aerea, guia_designacao, motorista_designacao, scouting, lancamento_financeiro, anotacao

**Tabela:** `auditoria_os`
```prisma
model AuditoriaOS {
  id           String            @id @default(uuid())
  orgId        String
  osId         String
  usuarioId    String
  usuarioNome  String            // Snapshot
  usuarioRole  RoleGlobal        // Snapshot
  acao         AcaoAuditoria
  entidade     EntidadeAuditoria
  entidadeId   String?
  dadosAntigos Json?
  dadosNovos   Json?
  campos       String[]
  descricao    String?
  metadata     Json?
  createdAt    DateTime

  // Relations: organizacao, os, usuario
}
```

**Índices otimizados:**
- Simples: orgId, osId, usuarioId, acao, entidade, entidadeId, createdAt
- Compostos: (osId, createdAt), (osId, entidade)

---

### 2. Sistema de Cache Redis ✅

**Localização:** `lib/cache/redis.ts`

**Features:**
- Cliente Redis abstrato (interface comum)
- MockRedisClient para desenvolvimento (fallback em memória)
- Suporte para Redis real (ioredis) - comentado até instalação
- Cache keys padronizados
- TTLs configuráveis

**Cache Keys:**
```typescript
AUDIT_CACHE_KEYS = {
  recentLogs: (osId) => `audit:os:${osId}:recent`,      // Últimas 24h
  stats: (osId) => `audit:os:${osId}:stats`,            // Estatísticas
  userActions: (osId) => `audit:os:${osId}:users`,      // Por usuário
  entityActions: (osId) => `audit:os:${osId}:entities`, // Por entidade
  lock: (key) => `audit:lock:${key}`,                   // Anti-duplicação
}
```

**TTLs (Time To Live):**
- recentLogs: 24 horas
- stats: 1 hora
- counters: 24 horas
- lock: 10 segundos

---

### 3. Utilitários de Auditoria ✅

**Localização:** `lib/utils/auditoria.ts`

**Funções principais:**

1. **identificarCamposAlterados(dadosAntigos, dadosNovos)**
   - Compara objetos e retorna lista de campos alterados
   - Ignora campos automáticos (updatedAt, createdAt)

2. **obterDetalhesAlteracoes(dadosAntigos, dadosNovos)**
   - Retorna objeto detalhado com valores antes/depois
   - Formato: `{ campo, valorAntigo, valorNovo }`

3. **sanitizarDados(dados)**
   - Remove campos sensíveis (senha, token, apiKey, etc)
   - Substitui por `***REDACTED***`

4. **gerarDescricaoAuditoria(params)**
   - Gera descrição legível em português
   - Ex: "Criou participante: João Silva"
   - Ex: "Atualizou atividade (campos: valor, data)"

5. **formatarDataAuditoria(data)**
   - Formata data de forma relativa
   - "Agora mesmo", "Há 5 minutos", "Há 2 dias"

6. **extrairMetadataRequisicao(request)**
   - Extrai IP, User-Agent, método, URL

7. **criarIdLock(params)**
   - Cria ID único para lock de deduplicação

---

### 4. Service de Auditoria ✅

**Localização:** `lib/services/auditoria.ts`

**Funções principais:**

#### `logAuditoria(params: LogAuditoriaParams)`
Registra uma ação de auditoria.

**Fluxo:**
1. Busca dados do usuário
2. Identifica campos alterados
3. Sanitiza dados sensíveis
4. Gera descrição automática
5. Verifica lock (anti-duplicação)
6. Salva no PostgreSQL
7. Atualiza cache no Redis (assíncrono)

**Exemplo de uso:**
```typescript
await logAuditoria({
  osId: 'uuid-da-os',
  usuarioId: 'uuid-do-usuario',
  acao: 'criar',
  entidade: 'participante',
  entidadeId: 'uuid-do-participante',
  dadosNovos: participante,
  metadata: { ip: '192.168.1.1', userAgent: '...' }
})
```

#### `buscarAuditorias(filters: AuditoriaFilters)`
Busca logs com filtros, usando cache quando possível.

**Filtros disponíveis:**
- osId (obrigatório)
- usuarioId
- acao
- entidade
- entidadeId
- dataInicio / dataFim
- page / limit

**Retorna:**
```typescript
{
  data: AuditoriaComUsuario[],
  total: number,
  fromCache: boolean
}
```

#### `buscarEstatisticasAuditoria(osId: string)`
Retorna estatísticas agregadas de uma OS.

**Retorna:**
```typescript
{
  totalAcoes: number,
  acoesUltimas24h: number,
  usuariosMaisAtivos: [
    { usuarioId, usuarioNome, quantidade }
  ],
  entidadesMaisAlteradas: [
    { entidade, quantidade }
  ]
}
```

#### Outras funções:
- `buscarAuditoriaPorId(id)` - Busca um log específico
- `limparCacheAuditoria(osId)` - Invalida cache
- `exportarAuditoria(filters)` - Exporta logs (até 10k)

---

### 5. Tipos TypeScript ✅

**Localização:** `types/index.ts`

**Tipos adicionados:**
- `LogAuditoriaParams` - Parâmetros para criar log
- `AuditoriaMetadata` - Metadata da requisição
- `AuditoriaFilters` - Filtros de busca
- `AuditoriaComUsuario` - Log com dados do usuário
- `CampoAlterado` - Campo com valores antes/depois
- `AuditoriaResumida` - Estatísticas agregadas

---

### 6. Migration ✅

**Localização:** `prisma/migrations/20251031162024_add_auditoria_system/`

**SQL gerado:**
- CREATE ENUM AcaoAuditoria
- CREATE ENUM EntidadeAuditoria
- CREATE TABLE auditoria_os
- CREATE INDEX (9 índices)
- ADD FOREIGN KEY (3 relações)

**Status:** ✅ Aplicada com sucesso

---

## Como usar o sistema

### 1. Registrar uma ação

```typescript
import { logAuditoria } from '@/lib/services/auditoria'

// Em uma API route
export async function POST(request: NextRequest) {
  const session = await requireAuth()

  // ... sua lógica ...
  const participante = await prisma.participante.create({ ... })

  // Registrar auditoria
  await logAuditoria({
    osId,
    usuarioId: session.userId,
    acao: 'criar',
    entidade: 'participante',
    entidadeId: participante.id,
    dadosNovos: participante,
    descricao: `Participante ${participante.nome} adicionado`,
    metadata: {
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    }
  })

  return NextResponse.json({ ... })
}
```

### 2. Atualização (com diff)

```typescript
// Buscar dados antigos
const dadosAntigos = await prisma.participante.findUnique({
  where: { id: participanteId }
})

// Atualizar
const participante = await prisma.participante.update({ ... })

// Registrar com diff
await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'atualizar',
  entidade: 'participante',
  entidadeId: participante.id,
  dadosAntigos,
  dadosNovos: participante,
  // Descrição e campos alterados são gerados automaticamente!
})
```

### 3. Buscar logs

```typescript
import { buscarAuditorias } from '@/lib/services/auditoria'

const { data, total, fromCache } = await buscarAuditorias({
  osId: 'uuid-da-os',
  page: 1,
  limit: 50
})

console.log(`${total} ações registradas (cache: ${fromCache})`)
```

### 4. Estatísticas

```typescript
import { buscarEstatisticasAuditoria } from '@/lib/services/auditoria'

const stats = await buscarEstatisticasAuditoria('uuid-da-os')

console.log(`Total: ${stats.totalAcoes}`)
console.log(`Últimas 24h: ${stats.acoesUltimas24h}`)
console.log('Usuários mais ativos:', stats.usuariosMaisAtivos)
```

---

## Performance e Otimizações

### PostgreSQL
- ✅ Índices otimizados para queries comuns
- ✅ Índices compostos para filtros combinados
- ✅ Queries paginadas por padrão
- ✅ Uso de `include` seletivo (apenas campos necessários)

### Redis Cache
- ✅ Logs recentes (24h) em cache (FIFO, max 100)
- ✅ Estatísticas cacheadas (1h de TTL)
- ✅ Contadores agregados (sorted sets)
- ✅ Lock de deduplicação (10s)
- ✅ Operações assíncronas não-bloqueantes
- ✅ Fallback para mock se Redis não disponível

### Segurança
- ✅ Sanitização automática de dados sensíveis
- ✅ Campos sensíveis substituídos por `***REDACTED***`
- ✅ Logs imutáveis (append-only)
- ✅ Cascade delete quando OS/Org é deletada
- ✅ Snapshot de dados do usuário (nome, role)

---

## Próximos Passos (Fase 2)

### 1. Integração nas APIs
- [ ] Integrar em `/api/os/[id]/participantes`
- [ ] Integrar em `/api/os/[id]/atividades`
- [ ] Integrar em `/api/os/[id]/hospedagens`
- [ ] Integrar em `/api/os/[id]/transportes`
- [ ] Integrar em `/api/os/route` (criar/atualizar OS)

### 2. Instalação do Redis Real (opcional)
```bash
npm install ioredis
```

Descomentar código em `lib/cache/redis.ts` e configurar `REDIS_URL` no `.env`:
```env
REDIS_URL=redis://localhost:6379
# ou
REDIS_URL=redis://usuario:senha@host:6379
```

---

## Arquivos Criados

```
✅ prisma/schema.prisma (atualizado)
✅ prisma/migrations/20251031162024_add_auditoria_system/migration.sql
✅ types/index.ts (atualizado)
✅ lib/cache/redis.ts (novo)
✅ lib/utils/auditoria.ts (novo)
✅ lib/services/auditoria.ts (novo)
✅ docs/auditoria-fase1.md (este arquivo)
```

---

## Conclusão

A Fase 1 está **100% completa** e pronta para uso! 🎉

O sistema agora tem:
- ✅ Estrutura de dados robusta (PostgreSQL)
- ✅ Cache inteligente (Redis com fallback)
- ✅ Utilitários completos
- ✅ Service pronto para uso
- ✅ Performance otimizada
- ✅ Segurança implementada

Próximo passo: **Fase 2 - Integração nas APIs existentes**
