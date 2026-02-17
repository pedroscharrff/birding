# Análise de Problemas: Status de Tours e Extensões

## Data: 2026-02-13
## Status: IDENTIFICADO

---

## 🔍 Problemas Identificados

### 1. **Histórico de Status não exibe dados de Extensões**

**Sintoma:**
- Quando uma extensão é selecionada, a aba "Informações Gerais" não mostra o histórico de status
- O histórico só aparece quando está na "Visão Geral" (Tour Principal)

**Causa Raiz:**
No arquivo `app/(dashboard)/dashboard/os/[id]/page.tsx`, linha 358-360:

```tsx
{filterByExtension(os.historicoStatus || []).length > 0 && (
  <OSStatusHistory historico={filterByExtension(os.historicoStatus || [])} />
)}
```

A função `filterByExtension` (linhas 98-106) está filtrando incorretamente:

```tsx
const filterByExtension = (items: any[]) => {
  if (!items) return []
  if (selectedExtensionId) {
    // Quando uma extensão está selecionada, mostrar APENAS os itens dessa extensão
    return items.filter((item: any) => item.extensaoId === selectedExtensionId)
  }
  // Quando "Visão Geral" está selecionada, mostrar APENAS itens do tour principal (sem extensão)
  return items.filter((item: any) => !item.extensaoId || item.extensaoId === null)
}
```

**Problema:** O histórico de status usa a propriedade `extensaoId`, mas o filtro está procurando por `extensaoId` nos itens, quando deveria estar verificando se o item pertence à extensão selecionada.

**Evidência dos Logs Prisma:**
```sql
SELECT "public"."os_historico_status"."extensao_id"
FROM "public"."os_historico_status"
WHERE "public"."os_historico_status"."os_id" IN ($1)
```

O campo correto no banco é `extensao_id`, que é mapeado para `extensaoId` no Prisma.

---

### 2. **Status de Extensão sendo salvo no Tour Principal**

**Sintoma:**
- Ao alterar o status de uma extensão, a mudança é registrada no histórico da Visão Geral
- O histórico da extensão permanece vazio

**Causa Raiz:**

#### A. Backend está correto ✅
O endpoint `/api/os/[id]/extensoes/[extensaoId]` (PATCH) está salvando corretamente:

```typescript
// Linha 135-144
await prisma.historicoStatus.create({
  data: {
    osId,
    extensaoId: extensao.id,  // ✅ Correto: salva o ID da extensão
    de: currentExtension.status,
    para: data.status as any,
    alteradoPor: session.userId,
    motivo: data.motivo || 'Alteração rápida de status'
  }
})
```

#### B. Frontend está enviando para o endpoint correto ✅
O componente `OSStatusSelect.tsx` (linhas 72-74) está construindo o endpoint corretamente:

```typescript
const endpoint = extensaoId 
  ? `/api/os/${osId}/extensoes/${extensaoId}`  // ✅ Correto
  : `/api/os/${osId}`
```

#### C. Possível problema de timing ⚠️
O problema pode estar na ordem de execução:

1. `OSStatusSelect` chama `executeStatusChange`
2. A API atualiza o status e cria o histórico
3. `onStatusChange` é chamado (linha 89-91)
4. `handleStatusChange` no `page.tsx` chama `refetch()` (linha 120)
5. **MAS**: o `refetch()` pode estar sendo chamado antes da transação do banco ser completada

---

## 📊 Evidências dos Logs

### Console Logs:
```
🎯 Renderizando OSStatusSelect: {
  selectedExtensionId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
  extensaoNome: 'Amazonas',
  status: 'planejamento'
}
```

### Prisma Logs:
```sql
-- Histórico sendo buscado corretamente
SELECT "public"."os_historico_status"."extensao_id"
FROM "public"."os_historico_status"
WHERE "public"."os_historico_status"."os_id" IN ($1)
ORDER BY "public"."os_historico_status"."created_at" DESC
```

---

## 🔧 Soluções Propostas

### Solução 1: Corrigir filtro de histórico (CRÍTICO)

**Arquivo:** `app/(dashboard)/dashboard/os/[id]/page.tsx`

**Problema:** A função `filterByExtension` não funciona para histórico de status porque o campo é `extensaoId` (não `extensaoId` como em outros itens).

**Correção:**
```tsx
// Criar função específica para histórico
const filterHistoricoByExtension = (historico: any[]) => {
  if (!historico) return []
  if (selectedExtensionId) {
    return historico.filter((item: any) => item.extensaoId === selectedExtensionId)
  }
  return historico.filter((item: any) => !item.extensaoId || item.extensaoId === null)
}

// Usar na linha 358-360
{filterHistoricoByExtension(os.historicoStatus || []).length > 0 && (
  <OSStatusHistory historico={filterHistoricoByExtension(os.historicoStatus || [])} />
)}
```

### Solução 2: Adicionar logs de debug

**Arquivo:** `app/(dashboard)/dashboard/os/[id]/page.tsx`

Adicionar logs para verificar o que está sendo filtrado:

```tsx
console.log('📋 Histórico completo:', os.historicoStatus)
console.log('📋 Histórico filtrado:', filterHistoricoByExtension(os.historicoStatus || []))
console.log('🔍 Extensão selecionada:', selectedExtensionId)
```

### Solução 3: Garantir atualização após mudança de status

**Arquivo:** `components/os/OSStatusSelect.tsx`

Adicionar callback de sucesso:

```typescript
const executeStatusChange = async (targetStatus: string, justificativa?: string) => {
  // ... código existente ...
  
  await update({
    endpoint,
    optimisticData: targetStatus,
    updateFn: (status) => {
      setLocalStatus(status)
      if (onStatusChange) {
        onStatusChange(status)
      }
    },
    rollbackFn: () => {
      setLocalStatus(oldStatus)
      if (onStatusChange) {
        onStatusChange(oldStatus)
      }
    },
    payload: {
      status: targetStatus,
      ...(justificativa && { motivo: justificativa }),
    },
    successMessage: 'Status atualizado com sucesso',
    errorMessage: 'Erro ao atualizar status',
  })

  // ✅ Adicionar delay para garantir que o banco foi atualizado
  await new Promise(resolve => setTimeout(resolve, 300))
  
  setPendingStatus(null)
}
```

---

## 🎯 Prioridade de Correção

1. **ALTA**: Corrigir filtro de histórico (Solução 1)
2. **MÉDIA**: Adicionar logs de debug (Solução 2)
3. **BAIXA**: Adicionar delay após atualização (Solução 3)

---

## ✅ Checklist de Testes

Após implementar as correções:

- [ ] Selecionar extensão "Amazonas"
- [ ] Alterar status da extensão
- [ ] Verificar se histórico aparece na aba da extensão
- [ ] Voltar para "Visão Geral"
- [ ] Verificar se histórico do tour principal está correto
- [ ] Selecionar outra extensão
- [ ] Verificar se histórico da nova extensão aparece
- [ ] Verificar logs do console e Prisma

---

## 📝 Notas Adicionais

### Estrutura do Histórico no Banco

```sql
CREATE TABLE os_historico_status (
  id UUID PRIMARY KEY,
  os_id UUID NOT NULL,
  extensao_id UUID NULL,  -- NULL = tour principal, UUID = extensão específica
  de StatusOS,
  para StatusOS NOT NULL,
  alterado_por UUID NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Mapeamento Prisma

```prisma
model HistoricoStatus {
  id          String   @id @default(uuid())
  osId        String   @map("os_id")
  extensaoId  String?  @map("extensao_id")  // ⚠️ Campo correto
  de          StatusOS?
  para        StatusOS
  alteradoPor String   @map("alterado_por")
  motivo      String?
  createdAt   DateTime @default(now()) @map("created_at")
  
  os        OS          @relation(fields: [osId], references: [id], onDelete: Cascade)
  extensao  OSExtensao? @relation(fields: [extensaoId], references: [id], onDelete: Cascade)
  usuario   Usuario     @relation(fields: [alteradoPor], references: [id])
}
```

---

## 🔍 Conclusão

O problema principal é que a função `filterByExtension` está sendo usada para filtrar o histórico de status, mas ela não está adaptada para lidar com a estrutura específica do histórico (que usa `extensaoId` diretamente, não através de um relacionamento).

A solução é criar uma função específica para filtrar o histórico ou adaptar a função existente para detectar o tipo de item sendo filtrado.
