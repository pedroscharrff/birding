# Correções Aplicadas: Status de Tours e Extensões

## Data: 2026-02-13
## Status: IMPLEMENTADO ✅

---

## 🔧 Correções Implementadas

### 1. **Filtro de Histórico de Status Corrigido** ✅

**Arquivo:** `app/(dashboard)/dashboard/os/[id]/page.tsx`

**Problema:** 
- A função `filterByExtension` estava sendo usada para filtrar o histórico de status
- Mas o histórico usa `extensaoId` diretamente, não através de um relacionamento como outros itens

**Solução:**
Criada função específica `filterHistoricoByExtension` que:
- Filtra corretamente pelo campo `extensaoId` do histórico
- Adiciona logs detalhados para debug
- Mostra apenas histórico da extensão selecionada ou do tour principal

```tsx
const filterHistoricoByExtension = (historico: any[]) => {
  if (!historico) return []
  
  console.log('📋 Filtrando histórico:', {
    total: historico.length,
    selectedExtensionId,
    items: historico.map(h => ({
      id: h.id,
      extensaoId: h.extensaoId,
      de: h.de,
      para: h.para,
      extensaoNome: h.extensao?.nome
    }))
  })
  
  if (selectedExtensionId) {
    const filtered = historico.filter((item: any) => item.extensaoId === selectedExtensionId)
    console.log('📋 Histórico filtrado para extensão:', filtered.length)
    return filtered
  }
  
  const filtered = historico.filter((item: any) => !item.extensaoId || item.extensaoId === null)
  console.log('📋 Histórico filtrado para tour principal:', filtered.length)
  return filtered
}
```

**Uso:**
```tsx
<TabsContent value="geral" className="space-y-4">
  <OSInfoSection os={os} />
  {filterHistoricoByExtension(os.historicoStatus || []).length > 0 && (
    <OSStatusHistory historico={filterHistoricoByExtension(os.historicoStatus || [])} />
  )}
</TabsContent>
```

---

### 2. **Logs de Debug Aprimorados** ✅

**Arquivo:** `components/os/OSStatusSelect.tsx`

**Adicionado:**
- Log de contexto (EXTENSÃO vs TOUR PRINCIPAL)
- Log de sucesso com detalhes
- Log de rollback com detalhes

```tsx
console.log('🔍 OSStatusSelect - Alterando status:', {
  contexto: extensaoId ? 'EXTENSÃO' : 'TOUR PRINCIPAL',
  extensaoId,
  endpoint,
  oldStatus,
  newStatus: targetStatus,
  justificativa
})

// No callback de sucesso:
console.log('✅ Status atualizado com sucesso:', {
  contexto: extensaoId ? 'EXTENSÃO' : 'TOUR PRINCIPAL',
  extensaoId,
  newStatus: status
})

// No callback de rollback:
console.log('❌ Rollback de status:', {
  contexto: extensaoId ? 'EXTENSÃO' : 'TOUR PRINCIPAL',
  extensaoId,
  backTo: oldStatus
})
```

---

## 📊 Fluxo Corrigido

### Antes (❌ Problema):
```
1. Usuário seleciona extensão "Amazonas"
2. Usuário altera status da extensão
3. Backend salva corretamente com extensaoId
4. Frontend usa filterByExtension para histórico
5. filterByExtension procura por item.extensaoId (campo errado)
6. Histórico não aparece na aba da extensão
```

### Depois (✅ Corrigido):
```
1. Usuário seleciona extensão "Amazonas"
2. Usuário altera status da extensão
3. Backend salva corretamente com extensaoId
4. Frontend usa filterHistoricoByExtension para histórico
5. filterHistoricoByExtension procura por item.extensaoId (campo correto)
6. Histórico aparece corretamente na aba da extensão
```

---

## 🧪 Como Testar

### Teste 1: Histórico de Extensão
1. Acesse uma OS com extensões
2. Selecione uma extensão (ex: "Amazonas")
3. Altere o status da extensão
4. Verifique se o histórico aparece na aba "Informações Gerais"
5. Verifique os logs do console:
   ```
   🔍 OSStatusSelect - Alterando status: {contexto: 'EXTENSÃO', ...}
   ✅ Status atualizado com sucesso: {contexto: 'EXTENSÃO', ...}
   📋 Filtrando histórico: {total: X, selectedExtensionId: 'xxx', ...}
   📋 Histórico filtrado para extensão: 1
   ```

### Teste 2: Histórico do Tour Principal
1. Volte para "Visão Geral" (Tour Principal)
2. Altere o status do tour
3. Verifique se o histórico aparece na aba "Informações Gerais"
4. Verifique os logs do console:
   ```
   🔍 OSStatusSelect - Alterando status: {contexto: 'TOUR PRINCIPAL', ...}
   ✅ Status atualizado com sucesso: {contexto: 'TOUR PRINCIPAL', ...}
   📋 Filtrando histórico: {total: X, selectedExtensionId: null, ...}
   📋 Histórico filtrado para tour principal: 1
   ```

### Teste 3: Isolamento de Histórico
1. Crie histórico para o tour principal
2. Crie histórico para extensão A
3. Crie histórico para extensão B
4. Verifique que:
   - Tour principal mostra apenas seu histórico
   - Extensão A mostra apenas seu histórico
   - Extensão B mostra apenas seu histórico

---

## 📝 Logs Esperados

### Console do Browser:
```
🎯 Renderizando OSStatusSelect: {
  selectedExtensionId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
  extensaoNome: 'Amazonas',
  status: 'planejamento'
}

🔍 OSStatusSelect - Alterando status: {
  contexto: 'EXTENSÃO',
  extensaoId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
  endpoint: '/api/os/c41b8ba7-594a-45b6-b6a9-4c152c60406a/extensoes/ee731db0-2cb1-4968-97dc-eb43c48e94a4',
  oldStatus: 'planejamento',
  newStatus: 'cotacoes',
  justificativa: undefined
}

✅ Status atualizado com sucesso: {
  contexto: 'EXTENSÃO',
  extensaoId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
  newStatus: 'cotacoes'
}

📋 Filtrando histórico: {
  total: 2,
  selectedExtensionId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
  items: [
    {
      id: 'xxx',
      extensaoId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
      de: 'planejamento',
      para: 'cotacoes',
      extensaoNome: 'Amazonas'
    },
    {
      id: 'yyy',
      extensaoId: null,
      de: 'planejamento',
      para: 'pronto_para_viagem',
      extensaoNome: undefined
    }
  ]
}

📋 Histórico filtrado para extensão: 1
```

### Prisma Logs:
```sql
-- Atualização da extensão
UPDATE "public"."os_extensoes" 
SET "status" = 'cotacoes'
WHERE "id" = 'ee731db0-2cb1-4968-97dc-eb43c48e94a4'

-- Criação do histórico
INSERT INTO "public"."os_historico_status" 
("os_id", "extensao_id", "de", "para", "alterado_por", "motivo")
VALUES (
  'c41b8ba7-594a-45b6-b6a9-4c152c60406a',
  'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
  'planejamento',
  'cotacoes',
  '4cb91132-0188-4a32-9a86-97e1a551acad',
  'Alteração rápida de status'
)

-- Busca do histórico
SELECT "public"."os_historico_status".*
FROM "public"."os_historico_status"
WHERE "public"."os_historico_status"."os_id" = 'c41b8ba7-594a-45b6-b6a9-4c152c60406a'
ORDER BY "public"."os_historico_status"."created_at" DESC
```

---

## ✅ Checklist de Verificação

Após implementar as correções, verificar:

- [x] Função `filterHistoricoByExtension` criada
- [x] Função usada no componente de histórico
- [x] Logs de debug adicionados ao OSStatusSelect
- [x] Logs de debug adicionados ao filtro de histórico
- [ ] Teste: Histórico de extensão aparece corretamente
- [ ] Teste: Histórico do tour principal aparece corretamente
- [ ] Teste: Históricos estão isolados entre extensões
- [ ] Teste: Logs do console estão claros e informativos

---

## 🎯 Próximos Passos

1. **Testar as correções** com o cenário real do usuário
2. **Verificar os logs** para confirmar que o fluxo está correto
3. **Remover logs de debug** se tudo estiver funcionando (ou mantê-los em modo de desenvolvimento)
4. **Documentar** o comportamento esperado para futura referência

---

## 📚 Referências

- Análise completa: `.analysis/status-issues-analysis.md`
- Arquivo principal: `app/(dashboard)/dashboard/os/[id]/page.tsx`
- Componente de status: `components/os/OSStatusSelect.tsx`
- API de extensões: `app/api/os/[id]/extensoes/[extensaoId]/route.ts`
- API principal: `app/api/os/[id]/route.ts`
