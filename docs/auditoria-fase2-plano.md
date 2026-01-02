# Plano de Implementação - Fase 2: Integração

Esta fase consiste em integrar o sistema de auditoria em todas as rotas de API existentes.

---

## Objetivos

- ✅ Registrar todas as operações CRUD nas entidades da OS
- ✅ Garantir rastreabilidade completa
- ✅ Manter performance otimizada
- ✅ Não quebrar funcionalidade existente

---

## Checklist de APIs

### 1. Participantes

**Arquivo:** `app/api/os/[id]/participantes/route.ts`

- [ ] **POST** - Criar participante
  - [ ] Importar `logAuditoria`
  - [ ] Adicionar log após `create`
  - [ ] Testar criação

**Arquivo:** `app/api/os/[id]/participantes/[participanteId]/route.ts`

- [ ] **PATCH** - Atualizar participante
  - [ ] Buscar `dadosAntigos` antes do update
  - [ ] Adicionar log com diff
  - [ ] Testar atualização

- [ ] **DELETE** - Deletar participante
  - [ ] Buscar `dadosAntigos` antes do delete
  - [ ] Adicionar log
  - [ ] Testar exclusão

---

### 2. Atividades

**Arquivo:** `app/api/os/[id]/atividades/route.ts`

- [ ] **POST** - Criar atividade
  - [ ] Importar `logAuditoria`
  - [ ] Adicionar log após `create`
  - [ ] Testar criação

**Arquivo:** `app/api/os/[id]/atividades/[atividadeId]/route.ts`

- [ ] **PATCH** - Atualizar atividade
  - [ ] Buscar `dadosAntigos`
  - [ ] Adicionar log com diff
  - [ ] Testar atualização

- [ ] **DELETE** - Deletar atividade
  - [ ] Buscar `dadosAntigos`
  - [ ] Adicionar log
  - [ ] Testar exclusão

---

### 3. Hospedagens

**Arquivo:** `app/api/os/[id]/hospedagens/route.ts`

- [ ] **POST** - Criar hospedagem
  - [ ] Importar `logAuditoria`
  - [ ] Adicionar log após `create`
  - [ ] Testar criação

**Arquivo:** `app/api/os/[id]/hospedagens/[hospedagemId]/route.ts`

- [ ] **PATCH** - Atualizar hospedagem
  - [ ] Buscar `dadosAntigos`
  - [ ] Adicionar log com diff
  - [ ] Testar atualização

- [ ] **DELETE** - Deletar hospedagem
  - [ ] Buscar `dadosAntigos`
  - [ ] Adicionar log
  - [ ] Testar exclusão

---

### 4. Transportes

**Arquivo:** `app/api/os/[id]/transportes/route.ts`

- [ ] **POST** - Criar transporte
  - [ ] Importar `logAuditoria`
  - [ ] Adicionar log após `create`
  - [ ] Testar criação

**Arquivo:** `app/api/os/[id]/transportes/[transporteId]/route.ts` (se existir)

- [ ] **PATCH** - Atualizar transporte
- [ ] **DELETE** - Deletar transporte

---

### 5. OS Principal

**Arquivo:** `app/api/os/route.ts`

- [x] **POST** - Criar OS (já tem `historicoStatus`)
  - [ ] Adicionar `logAuditoria` para ação 'criar'
  - [ ] Testar criação

**Arquivo:** `app/api/os/[id]/route.ts`

- [ ] **PATCH** - Atualizar OS
  - [ ] Buscar `dadosAntigos`
  - [ ] Verificar se status mudou
  - [ ] Se status mudou: log com ação 'status_alterado'
  - [ ] Senão: log com ação 'atualizar'
  - [ ] Testar atualização

- [ ] **DELETE** - Deletar OS (se existir)
  - [ ] Buscar `dadosAntigos`
  - [ ] Adicionar log
  - [ ] Testar exclusão

---

### 6. Outras Entidades (Opcional)

**Passagens Aéreas**
- [ ] POST /api/os/[id]/passagens-aereas
- [ ] PATCH /api/os/[id]/passagens-aereas/[id]
- [ ] DELETE /api/os/[id]/passagens-aereas/[id]

**Guias / Motoristas**
- [ ] POST /api/os/[id]/guias
- [ ] DELETE /api/os/[id]/guias/[id]
- [ ] POST /api/os/[id]/motoristas
- [ ] DELETE /api/os/[id]/motoristas/[id]

**Scoutings**
- [ ] POST /api/os/[id]/scoutings
- [ ] PATCH /api/os/[id]/scoutings/[id]
- [ ] DELETE /api/os/[id]/scoutings/[id]

**Anotações**
- [ ] POST /api/os/[id]/anotacoes
- [ ] DELETE /api/os/[id]/anotacoes/[id]

**Lançamentos Financeiros**
- [ ] POST /api/os/[id]/lancamentos
- [ ] PATCH /api/os/[id]/lancamentos/[id]
- [ ] DELETE /api/os/[id]/lancamentos/[id]

---

## Padrão de Implementação

### Para cada endpoint:

1. **Importar service**
   ```typescript
   import { logAuditoria } from '@/lib/services/auditoria'
   ```

2. **POST (Create)**
   ```typescript
   const registro = await prisma.ENTIDADE.create({ ... })

   await logAuditoria({
     osId,
     usuarioId: session.userId,
     acao: 'criar',
     entidade: 'NOME_ENTIDADE',
     entidadeId: registro.id,
     dadosNovos: registro,
   })
   ```

3. **PATCH (Update)**
   ```typescript
   const dadosAntigos = await prisma.ENTIDADE.findUnique({ where: { id } })
   const registro = await prisma.ENTIDADE.update({ ... })

   await logAuditoria({
     osId,
     usuarioId: session.userId,
     acao: 'atualizar',
     entidade: 'NOME_ENTIDADE',
     entidadeId: registro.id,
     dadosAntigos,
     dadosNovos: registro,
   })
   ```

4. **DELETE (Delete)**
   ```typescript
   const dadosAntigos = await prisma.ENTIDADE.findUnique({ where: { id } })
   await prisma.ENTIDADE.delete({ where: { id } })

   await logAuditoria({
     osId,
     usuarioId: session.userId,
     acao: 'excluir',
     entidade: 'NOME_ENTIDADE',
     entidadeId: id,
     dadosAntigos,
   })
   ```

---

## Testes

### Para cada endpoint modificado:

1. **Teste Manual**
   - [ ] Criar registro
   - [ ] Verificar log criado: `SELECT * FROM auditoria_os ORDER BY created_at DESC LIMIT 1;`
   - [ ] Atualizar registro
   - [ ] Verificar diff nos logs
   - [ ] Deletar registro
   - [ ] Verificar log de exclusão

2. **Teste via API**
   ```bash
   # Criar
   curl -X POST http://localhost:3000/api/os/[id]/participantes \
     -H "Content-Type: application/json" \
     -H "Cookie: ..." \
     -d '{"nome": "Teste", "email": "teste@test.com"}'

   # Buscar logs
   curl http://localhost:3000/api/os/[id]/auditoria
   ```

3. **Verificar no DB**
   ```sql
   SELECT
     created_at,
     usuario_nome,
     acao,
     entidade,
     descricao,
     campos
   FROM auditoria_os
   WHERE os_id = 'uuid-da-os'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

## Métricas de Sucesso

Ao final da Fase 2, devemos ter:

- ✅ 100% das operações CRUD sendo auditadas
- ✅ Descrições legíveis em português
- ✅ Diff completo em atualizações
- ✅ Performance mantida (< 100ms overhead)
- ✅ Zero erros em produção
- ✅ Logs visualizáveis no banco

---

## Estimativa de Tempo

| Entidade | Endpoints | Tempo Estimado |
|----------|-----------|----------------|
| Participantes | 3 (POST, PATCH, DELETE) | 30 min |
| Atividades | 3 | 30 min |
| Hospedagens | 3 | 30 min |
| Transportes | 2-3 | 30 min |
| OS Principal | 2 (POST, PATCH) | 30 min |
| Testes | - | 1h |
| **Total** | | **~4h** |

---

## Ordem Recomendada

1. ✅ **Participantes** (mais simples, para testar o fluxo)
2. ✅ **Atividades**
3. ✅ **Hospedagens**
4. ✅ **Transportes**
5. ✅ **OS Principal** (tem lógica especial de status)
6. ✅ **Testes gerais**
7. ⏭️ Outras entidades (se necessário)

---

## Possíveis Problemas e Soluções

### Problema 1: "osId não disponível no contexto"

**Solução:** Buscar a OS primeiro ou extrair osId dos params.

```typescript
const participante = await prisma.participante.findUnique({
  where: { id },
  include: { os: { select: { id: true } } }
})

const osId = participante.os.id
```

### Problema 2: "Auditoria falha e quebra operação"

**Solução:** Wrap em try-catch separado.

```typescript
try {
  await logAuditoria({ ... })
} catch (auditError) {
  console.error('[Auditoria] Erro:', auditError)
  // Não falha a operação principal
}
```

### Problema 3: "Performance lenta"

**Solução:**
- Verificar se índices foram criados
- Usar `Promise.allSettled` para paralelizar
- Instalar Redis para cache

---

## Após Completar Fase 2

Próximos passos:

1. **Criar API de auditoria**
   - `GET /api/os/[id]/auditoria` - Listar logs
   - `GET /api/os/[id]/auditoria/stats` - Estatísticas

2. **Documentar mudanças**
   - Atualizar README com APIs integradas
   - Adicionar changelog

3. **Começar Fase 3**
   - Interface de visualização
   - Timeline interativa
   - Diff viewer

---

**Bom trabalho! 🚀**

_Este documento será atualizado conforme o progresso da Fase 2._
