# Análise Detalhada: Salvamento de Status em Extensões

## Data: 2026-02-13 07:33
## Status: INVESTIGAÇÃO EM ANDAMENTO

---

## 🔍 Problema Relatado

**Sintoma:** Ao alterar o status de uma extensão, a mudança está sendo salva no Tour Principal ao invés de na extensão correspondente.

---

## ✅ O que JÁ está CORRETO

### 1. Schema do Prisma ✅
O schema está corretamente configurado com `extensaoId` em todas as tabelas relevantes:

```prisma
model HistoricoStatus {
  id          String    @id @default(uuid())
  osId        String    @map("os_id")
  extensaoId  String?   @map("extensao_id")  // ✅ Campo presente
  de          StatusOS?
  para        StatusOS
  alteradoPor String    @map("alterado_por")
  motivo      String?
  createdAt   DateTime  @default(now()) @map("created_at")

  os       OS          @relation(fields: [osId], references: [id], onDelete: Cascade)
  extensao OSExtensao? @relation(fields: [extensaoId], references: [id])
  usuario  Usuario     @relation(fields: [alteradoPor], references: [id])
}
```

### 2. API de Extensões ✅
O endpoint `/api/os/[id]/extensoes/[extensaoId]` (PATCH) está salvando corretamente:

```typescript
// Linha 135-144 de app/api/os/[id]/extensoes/[extensaoId]/route.ts
await prisma.historicoStatus.create({
  data: {
    osId,
    extensaoId: extensao.id,  // ✅ Salvando o ID da extensão
    de: currentExtension.status,
    para: data.status as any,
    alteradoPor: session.userId,
    motivo: data.motivo || 'Alteração rápida de status'
  }
})
```

### 3. Frontend - OSStatusSelect ✅
O componente está construindo o endpoint corretamente:

```typescript
// Linha 72-74 de components/os/OSStatusSelect.tsx
const endpoint = extensaoId 
  ? `/api/os/${osId}/extensoes/${extensaoId}`  // ✅ Endpoint correto para extensão
  : `/api/os/${osId}`                          // ✅ Endpoint correto para tour principal
```

### 4. Frontend - OSGuiasSection ✅
O componente está enviando `extensaoId` corretamente:

```typescript
// Linha 102-106 de components/os/OSGuiasSection.tsx
const payload = {
  guiaId: formData.guiaId,
  funcao: formData.funcao?.trim() || null,
  extensaoId: extensaoId || null // ✅ Enviando extensaoId
}
```

---

## ❓ Onde pode estar o problema?

### Hipótese 1: Problema no Fluxo de Dados
O `selectedExtensionId` pode não estar sendo passado corretamente para o `OSStatusSelect`.

**Verificar:**
```tsx
// Em app/(dashboard)/dashboard/os/[id]/page.tsx linha 195-208
<OSStatusSelect
  key={selectedExtensionId || 'os-main'}
  osId={os.id}
  extensaoId={selectedExtensionId}  // ⚠️ Verificar se este valor está correto
  osTitulo={selectedExtensionId 
    ? (os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.nome || 'Extensão')
    : os.titulo}
  currentStatus={selectedExtensionId 
    ? (os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.status || 'planejamento')
    : (currentStatus || os.status)}
  onStatusChange={handleStatusChange}
  variant="badge"
  size="md"
/>
```

### Hipótese 2: Estado `selectedExtensionId` não está sendo atualizado
O estado pode estar como `null` mesmo quando uma extensão é selecionada.

**Verificar logs:**
```tsx
// Linha 184-194 de page.tsx
{(() => {
  console.log('🎯 Renderizando OSStatusSelect:', {
    selectedExtensionId,
    extensaoNome: selectedExtensionId 
      ? os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.nome 
      : 'Tour Principal',
    status: selectedExtensionId 
      ? os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.status 
      : os.status
  })
  return null
})()}
```

### Hipótese 3: Componente sendo remontado sem `extensaoId`
O `key={selectedExtensionId || 'os-main'}` força remontagem, mas pode estar perdendo o contexto.

---

## 🧪 Testes para Identificar o Problema

### Teste 1: Verificar logs do console
Ao selecionar uma extensão e alterar o status, verificar:

```
🎯 Renderizando OSStatusSelect: {
  selectedExtensionId: 'xxx',  // ⚠️ Deve ser o ID da extensão, não null
  extensaoNome: 'Amazonas',
  status: 'planejamento'
}

🔍 OSStatusSelect - Alterando status: {
  contexto: 'EXTENSÃO',  // ⚠️ Deve ser 'EXTENSÃO', não 'TOUR PRINCIPAL'
  extensaoId: 'xxx',     // ⚠️ Deve ter um ID, não undefined
  endpoint: '/api/os/.../extensoes/xxx',  // ⚠️ Deve ser o endpoint da extensão
  oldStatus: 'planejamento',
  newStatus: 'cotacoes'
}
```

### Teste 2: Verificar query do Prisma
Após alterar status da extensão, verificar se o INSERT está correto:

```sql
-- ✅ CORRETO: extensao_id deve ter um UUID
INSERT INTO "public"."os_historico_status" 
("os_id", "extensao_id", "de", "para", "alterado_por", "motivo")
VALUES (
  'c41b8ba7-594a-45b6-b6a9-4c152c60406a',
  'ee731db0-2cb1-4968-97dc-eb43c48e94a4',  -- ✅ ID da extensão
  'planejamento',
  'cotacoes',
  '4cb91132-0188-4a32-9a86-97e1a551acad',
  'Alteração rápida de status'
)

-- ❌ ERRADO: extensao_id NULL significa tour principal
INSERT INTO "public"."os_historico_status" 
("os_id", "extensao_id", "de", "para", "alterado_por", "motivo")
VALUES (
  'c41b8ba7-594a-45b6-b6a9-4c152c60406a',
  NULL,  -- ❌ Não deveria ser NULL para extensão
  'planejamento',
  'cotacoes',
  '4cb91132-0188-4a32-9a86-97e1a551acad',
  'Alteração rápida de status'
)
```

### Teste 3: Adicionar logs no OSStatusSelect
Adicionar log antes de chamar a API:

```typescript
const executeStatusChange = async (targetStatus: string, justificativa?: string) => {
  const oldStatus = localStatus
  const endpoint = extensaoId 
    ? `/api/os/${osId}/extensoes/${extensaoId}` 
    : `/api/os/${osId}`

  console.log('🔍 OSStatusSelect - ANTES DE CHAMAR API:', {
    extensaoId,  // ⚠️ Verificar se é string ou null
    endpoint,
    payload: {
      status: targetStatus,
      ...(justificativa && { motivo: justificativa }),
    }
  })
  
  // ... resto do código
}
```

---

## 🎯 Próximos Passos

1. **Executar Teste 1**: Verificar logs do console ao alterar status de extensão
2. **Executar Teste 2**: Verificar query do Prisma no terminal
3. **Executar Teste 3**: Adicionar logs adicionais se necessário
4. **Identificar**: Onde exatamente o `extensaoId` está sendo perdido

---

## 📝 Checklist de Verificação

- [x] Schema do Prisma tem campo `extensaoId`
- [x] API de extensões salva `extensaoId` corretamente
- [x] Frontend constrói endpoint correto
- [x] Componentes enviam `extensaoId` no payload
- [ ] `selectedExtensionId` está sendo atualizado corretamente
- [ ] `OSStatusSelect` recebe `extensaoId` correto
- [ ] API está recebendo `extensaoId` no request
- [ ] Banco de dados está salvando `extensaoId` correto

---

## 🔧 Possíveis Correções

### Se o problema for no estado `selectedExtensionId`:

```tsx
// Garantir que o estado seja atualizado corretamente
const handleSelectExtension = (id: string | null) => {
  console.log('🔄 Selecionando extensão:', id)
  setSelectedExtensionId(id)
}
```

### Se o problema for no componente OSStatusSelect:

```tsx
// Garantir que extensaoId seja passado corretamente
useEffect(() => {
  console.log('📍 OSStatusSelect montado com:', {
    osId,
    extensaoId,
    osTitulo,
    currentStatus
  })
}, [osId, extensaoId, osTitulo, currentStatus])
```

### Se o problema for na API:

```typescript
// Adicionar validação no endpoint
console.log('📥 API recebeu:', {
  osId,
  extensaoId,
  body
})
```
