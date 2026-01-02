# Sistema de Auditoria - Documentação Completa

Sistema completo de logs e auditoria para rastreamento de todas as ações realizadas nas Ordens de Serviço (OS).

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Como Usar](#como-usar)
- [Exemplos](#exemplos)
- [Performance](#performance)
- [Segurança](#segurança)
- [Documentos Relacionados](#documentos-relacionados)

---

## 🎯 Visão Geral

O sistema de auditoria registra **todas as ações** realizadas nas OS, permitindo:

- ✅ **Rastreabilidade completa**: Quem fez o quê, quando e por quê
- ✅ **Histórico de alterações**: Valores antes/depois (diff)
- ✅ **Compliance**: Auditoria para fins regulatórios
- ✅ **Troubleshooting**: Investigar problemas e entender mudanças
- ✅ **Analytics**: Estatísticas de uso e atividade

---

## 🏗️ Arquitetura

### Camadas

```
┌─────────────────────────────────────────────┐
│           APIs / Endpoints                   │
│  (POST/PATCH/DELETE participantes, etc)     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│     Service de Auditoria                     │
│     lib/services/auditoria.ts                │
│  - logAuditoria()                            │
│  - buscarAuditorias()                        │
│  - buscarEstatisticas()                      │
└──────────┬─────────────────┬────────────────┘
           │                 │
           ▼                 ▼
    ┌──────────┐      ┌────────────┐
    │PostgreSQL│      │   Redis    │
    │  (Prisma)│      │  (Cache)   │
    └──────────┘      └────────────┘
    Permanente        Temporário
    - Todos logs      - Logs recentes (24h)
    - Busca filtrada  - Estatísticas (1h)
    - Exportação      - Contadores
```

### Componentes

1. **Schema Prisma** (`prisma/schema.prisma`)
   - Model: `AuditoriaOS`
   - Enums: `AcaoAuditoria`, `EntidadeAuditoria`
   - Índices otimizados

2. **Service** (`lib/services/auditoria.ts`)
   - Lógica principal de registro e consulta
   - Integração com PostgreSQL e Redis

3. **Cache Redis** (`lib/cache/redis.ts`)
   - Cliente Redis abstrato
   - Mock para desenvolvimento
   - Keys e TTLs configuráveis

4. **Utilitários** (`lib/utils/auditoria.ts`)
   - Comparação de objetos (diff)
   - Sanitização de dados sensíveis
   - Formatação e tradução

5. **Tipos** (`types/index.ts`)
   - TypeScript types completos

---

## ✨ Funcionalidades

### 1. Registro de Ações

**Ações suportadas:**
- `criar` - Novo registro criado
- `atualizar` - Registro modificado
- `excluir` - Registro removido
- `visualizar` - Acesso a dados sensíveis
- `exportar` - Exportação de dados
- `status_alterado` - Mudança de status da OS

**Entidades rastreadas:**
- `os` - Ordem de Serviço
- `participante` - Participantes
- `fornecedor_os` - Fornecedores da OS
- `atividade` - Atividades
- `hospedagem` - Hospedagens
- `transporte` - Transportes
- `passagem_aerea` - Passagens aéreas
- `guia_designacao` - Designações de guia
- `motorista_designacao` - Designações de motorista
- `scouting` - Scoutings
- `lancamento_financeiro` - Lançamentos financeiros
- `anotacao` - Anotações

### 2. Diff Automático

O sistema automaticamente:
- Compara valores antigos vs novos
- Identifica campos alterados
- Gera descrição legível em português
- Sanitiza dados sensíveis

### 3. Cache Inteligente

**Redis (quando disponível):**
- Logs recentes em cache (últimas 24h)
- Estatísticas agregadas (TTL: 1h)
- Contadores por usuário/entidade
- Lock para prevenir duplicação

**Fallback:**
- MockRedisClient em memória
- Funciona sem Redis instalado
- Desenvolvimento facilitado

### 4. Busca e Filtros

**Filtros disponíveis:**
- Por OS (obrigatório)
- Por usuário
- Por ação
- Por entidade
- Por período (data início/fim)
- Paginação

### 5. Estatísticas

**Métricas calculadas:**
- Total de ações
- Ações nas últimas 24h
- Usuários mais ativos (top 5)
- Entidades mais alteradas (top 5)

### 6. Segurança

**Proteções implementadas:**
- Sanitização de campos sensíveis (senha, token, etc)
- Snapshot de dados do usuário (nome, role)
- Logs imutáveis (append-only)
- Cascade delete (GDPR compliance)
- Lock de deduplicação

---

## 🚀 Como Usar

### Registrar uma ação

```typescript
import { logAuditoria } from '@/lib/services/auditoria'

await logAuditoria({
  osId: 'uuid-da-os',
  usuarioId: session.userId,
  acao: 'criar',
  entidade: 'participante',
  entidadeId: participante.id,
  dadosNovos: participante,
  metadata: {
    ip: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
  }
})
```

### Buscar logs

```typescript
import { buscarAuditorias } from '@/lib/services/auditoria'

const { data, total, fromCache } = await buscarAuditorias({
  osId: 'uuid-da-os',
  usuarioId: 'uuid-usuario', // opcional
  acao: 'atualizar', // opcional
  page: 1,
  limit: 50
})
```

### Obter estatísticas

```typescript
import { buscarEstatisticasAuditoria } from '@/lib/services/auditoria'

const stats = await buscarEstatisticasAuditoria('uuid-da-os')

console.log(`Total: ${stats.totalAcoes}`)
console.log(`Últimas 24h: ${stats.acoesUltimas24h}`)
```

---

## 📝 Exemplos

### Criar participante

```typescript
const participante = await prisma.participante.create({
  data: validatedData
})

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'criar',
  entidade: 'participante',
  entidadeId: participante.id,
  dadosNovos: participante,
})

// Resultado no log:
// ✅ "Criou participante: João Silva"
```

### Atualizar com diff

```typescript
const dadosAntigos = await prisma.participante.findUnique({
  where: { id: participanteId }
})

const participante = await prisma.participante.update({
  where: { id: participanteId },
  data: { email: 'novo@email.com', telefone: '11999999999' }
})

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'atualizar',
  entidade: 'participante',
  entidadeId: participante.id,
  dadosAntigos,
  dadosNovos: participante,
})

// Resultado no log:
// ✅ "Atualizou participante (campos: email, telefone)"
// Campos alterados: ['email', 'telefone']
// Diff disponível em dadosAntigos/dadosNovos
```

### Deletar

```typescript
const dadosAntigos = await prisma.participante.findUnique({
  where: { id: participanteId }
})

await prisma.participante.delete({
  where: { id: participanteId }
})

await logAuditoria({
  osId,
  usuarioId: session.userId,
  acao: 'excluir',
  entidade: 'participante',
  entidadeId: participanteId,
  dadosAntigos,
})

// Resultado no log:
// ✅ "Excluiu participante: João Silva"
```

---

## ⚡ Performance

### PostgreSQL

**Índices criados:**
- Simples: `orgId`, `osId`, `usuarioId`, `acao`, `entidade`, `entidadeId`, `createdAt`
- Compostos: `(osId, createdAt)`, `(osId, entidade)`

**Otimizações:**
- Queries paginadas por padrão
- `COUNT` separado (sem OFFSET)
- `include` seletivo
- Limit máximo: 10.000 (exportação)

### Redis Cache

**Estratégia:**
- Logs recentes (24h): FIFO list, max 100
- Estatísticas: Cache com TTL 1h
- Contadores: Sorted sets (ZINCRBY)
- Lock: 10 segundos

**Fallback:**
- Mock em memória se Redis indisponível
- Sem dependência obrigatória

### Benchmarks Esperados

| Operação | Sem Cache | Com Redis |
|----------|-----------|-----------|
| Listar 50 logs recentes | ~50-100ms | ~5-10ms |
| Estatísticas da OS | ~100-200ms | ~5ms |
| Criar log | ~50ms | ~50ms |

---

## 🔒 Segurança

### Dados Sensíveis

**Campos sanitizados:**
- `senha`, `password`, `hashSenha`
- `token`, `secret`, `apiKey`
- `creditCard`, `cvv`

**Substituídos por:** `***REDACTED***`

### Imutabilidade

- Logs não podem ser editados
- Apenas CREATE e READ
- Append-only

### GDPR/LGPD

- Cascade delete ao deletar OS/Organização
- Snapshot de dados do usuário (histórico preservado)
- Exportação de dados disponível

### Deduplicação

- Lock temporário (10s) por ação
- Previne logs duplicados

---

## 📚 Documentos Relacionados

1. **[auditoria-fase1.md](./auditoria-fase1.md)**
   - Detalhes da implementação da Fase 1
   - Estrutura completa
   - Próximos passos

2. **[auditoria-exemplos-integracao.md](./auditoria-exemplos-integracao.md)**
   - Exemplos práticos de integração
   - Padrões por entidade
   - Wrapper helpers

---

## 🛠️ Configuração

### Obrigatório

✅ Já configurado! Tudo funciona out-of-the-box.

### Opcional: Redis Real

Para melhor performance em produção:

```bash
npm install ioredis
```

**`.env`:**
```env
REDIS_URL=redis://localhost:6379
# ou
REDIS_URL=redis://usuario:senha@host:6379/0
```

**Descomentar em** `lib/cache/redis.ts`:
```typescript
// Linhas 173-197 (código do ioredis)
```

---

## 🔍 Troubleshooting

### "Logs não aparecem"

1. Verificar se `logAuditoria()` foi chamado
2. Checar console para erros
3. Verificar banco: `SELECT * FROM auditoria_os ORDER BY created_at DESC LIMIT 10;`

### "Cache não funciona"

1. Verificar se `REDIS_URL` está configurada (opcional)
2. Se não, MockRedisClient em memória é usado (normal)
3. Checar campo `fromCache` no retorno de `buscarAuditorias()`

### "Performance lenta"

1. Verificar índices: `\d auditoria_os` no PostgreSQL
2. Considerar instalar Redis real
3. Reduzir `limit` nas queries
4. Usar filtros mais específicos

---

## 📊 Estatísticas de Uso

Para visualizar o uso do sistema:

```sql
-- Total de logs
SELECT COUNT(*) FROM auditoria_os;

-- Logs por ação
SELECT acao, COUNT(*) as total
FROM auditoria_os
GROUP BY acao
ORDER BY total DESC;

-- Logs por entidade
SELECT entidade, COUNT(*) as total
FROM auditoria_os
GROUP BY entidade
ORDER BY total DESC;

-- Usuários mais ativos
SELECT usuario_nome, COUNT(*) as total
FROM auditoria_os
GROUP BY usuario_id, usuario_nome
ORDER BY total DESC
LIMIT 10;
```

---

## 🎯 Roadmap

### Fase 1: Fundação ✅
- [x] Schema e migrations
- [x] Service completo
- [x] Cache Redis
- [x] Utilitários
- [x] Documentação

### Fase 2: Integração 🔄
- [ ] Integrar em todas as APIs de OS
- [ ] Testes de integração
- [ ] Validação em produção

### Fase 3: Interface 📅
- [ ] Página de auditoria da OS
- [ ] Timeline visual
- [ ] Diff viewer
- [ ] Filtros avançados
- [ ] Exportação (CSV/JSON)

### Fase 4: Analytics 🔮
- [ ] Dashboard de auditoria
- [ ] Relatórios automáticos
- [ ] Alertas de ações suspeitas
- [ ] Métricas de compliance

---

## 🤝 Contribuindo

Para adicionar novas entidades:

1. Adicionar ao enum `EntidadeAuditoria` no schema
2. Adicionar tradução em `lib/utils/auditoria.ts` (função `traduzirEntidade`)
3. Integrar nos endpoints da entidade
4. Atualizar documentação

---

## 📞 Suporte

Dúvidas? Consulte:
- Este README
- [Exemplos de Integração](./auditoria-exemplos-integracao.md)
- [Detalhes da Fase 1](./auditoria-fase1.md)

---

**Sistema desenvolvido em:** 31/10/2024
**Status:** ✅ Fase 1 completa e pronta para uso
**Versão:** 1.0.0
