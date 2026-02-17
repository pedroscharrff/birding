# Correções Aplicadas: Logs de Debug para Rastreamento de Status

## Data: 2026-02-13 07:40
## Status: LOGS ADICIONADOS ✅

---

## 🔧 Alterações Implementadas

### 1. **Logs no Componente OSStatusSelect** ✅

**Arquivo:** `components/os/OSStatusSelect.tsx`

#### A. Log de Renderização
Adicionado log sempre que o componente é renderizado:

```tsx
console.log('🎨 OSStatusSelect RENDERIZADO:', {
  osId,
  extensaoId,
  osTitulo,
  currentStatus,
  localStatus,
  contexto: extensaoId ? `EXTENSÃO (${extensaoId})` : 'TOUR PRINCIPAL'
})
```

**Propósito:** Verificar se o `extensaoId` está sendo passado corretamente para o componente.

#### B. Log de Mudança de Status
Adicionado log quando `currentStatus` muda:

```tsx
useEffect(() => {
  console.log('🔄 OSStatusSelect - currentStatus mudou:', {
    extensaoId,
    oldLocalStatus: localStatus,
    newCurrentStatus: currentStatus,
    contexto: extensaoId ? 'EXTENSÃO' : 'TOUR PRINCIPAL'
  })
  setLocalStatus(currentStatus)
}, [currentStatus, extensaoId])
```

**Propósito:** Rastrear quando e como o status local é sincronizado.

#### C. Log Antes de Alterar Status
Adicionado log antes de executar a mudança:

```tsx
console.log('🔍 OSStatusSelect - Alterando status:', {
  contexto: extensaoId ? 'EXTENSÃO' : 'TOUR PRINCIPAL',
  extensaoId,
  endpoint,
  oldStatus,
  newStatus: targetStatus,
  justificativa
})
```

**Propósito:** Verificar o endpoint que será chamado e o contexto da alteração.

#### D. Log Antes de Enviar para API
Adicionado log do payload completo:

```tsx
const payload = {
  status: targetStatus,
  ...(justificativa && { motivo: justificativa }),
}

console.log('📤 OSStatusSelect - Enviando para API:', {
  contexto: extensaoId ? 'EXTENSÃO' : 'TOUR PRINCIPAL',
  endpoint,
  payload,
  extensaoId,
  osId
})
```

**Propósito:** Verificar exatamente o que está sendo enviado para a API.

#### E. Log de Sucesso
Log quando a atualização é bem-sucedida:

```tsx
console.log('✅ Status atualizado com sucesso:', {
  contexto: extensaoId ? 'EXTENSÃO' : 'TOUR PRINCIPAL',
  extensaoId,
  newStatus: status
})
```

#### F. Log de Rollback
Log quando há erro e o status é revertido:

```tsx
console.log('❌ Rollback de status:', {
  contexto: extensaoId ? 'EXTENSÃO' : 'TOUR PRINCIPAL',
  extensaoId,
  backTo: oldStatus
})
```

---

### 2. **Logs Existentes no page.tsx** ✅

**Arquivo:** `app/(dashboard)/dashboard/os/[id]/page.tsx`

#### A. Log de Renderização do OSStatusSelect
```tsx
console.log('🎯 Renderizando OSStatusSelect:', {
  selectedExtensionId,
  extensaoNome: selectedExtensionId 
    ? os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.nome 
    : 'Tour Principal',
  status: selectedExtensionId 
    ? os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.status 
    : os.status
})
```

#### B. Log de Filtro de Histórico
```tsx
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
```

---

## 📊 Fluxo Completo de Logs Esperado

Quando o usuário seleciona uma extensão e altera o status, os logs devem aparecer nesta ordem:

```
1. 🎯 Renderizando OSStatusSelect: {
     selectedExtensionId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
     extensaoNome: 'Amazonas',
     status: 'planejamento'
   }

2. 🎨 OSStatusSelect RENDERIZADO: {
     osId: 'c41b8ba7-594a-45b6-b6a9-4c152c60406a',
     extensaoId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',  // ⚠️ DEVE TER VALOR
     osTitulo: 'Amazonas',
     currentStatus: 'planejamento',
     localStatus: 'planejamento',
     contexto: 'EXTENSÃO (ee731db0-2cb1-4968-97dc-eb43c48e94a4)'
   }

3. 🔍 OSStatusSelect - Alterando status: {
     contexto: 'EXTENSÃO',  // ⚠️ DEVE SER 'EXTENSÃO'
     extensaoId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',  // ⚠️ DEVE TER VALOR
     endpoint: '/api/os/c41b8ba7-594a-45b6-b6a9-4c152c60406a/extensoes/ee731db0-2cb1-4968-97dc-eb43c48e94a4',
     oldStatus: 'planejamento',
     newStatus: 'cotacoes',
     justificativa: undefined
   }

4. 📤 OSStatusSelect - Enviando para API: {
     contexto: 'EXTENSÃO',
     endpoint: '/api/os/.../extensoes/...',
     payload: { status: 'cotacoes' },
     extensaoId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',  // ⚠️ DEVE TER VALOR
     osId: 'c41b8ba7-594a-45b6-b6a9-4c152c60406a'
   }

5. ✅ Status atualizado com sucesso: {
     contexto: 'EXTENSÃO',
     extensaoId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
     newStatus: 'cotacoes'
   }

6. 📋 Filtrando histórico: {
     total: 2,
     selectedExtensionId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4',
     items: [...]
   }

7. 📋 Histórico filtrado para extensão: 1
```

---

## 🚨 Sinais de Problema

### Se `extensaoId` for `null` ou `undefined`:

```
❌ PROBLEMA: extensaoId está null/undefined

🎨 OSStatusSelect RENDERIZADO: {
  extensaoId: null,  // ❌ PROBLEMA AQUI
  contexto: 'TOUR PRINCIPAL'  // ❌ Deveria ser 'EXTENSÃO'
}

🔍 OSStatusSelect - Alterando status: {
  contexto: 'TOUR PRINCIPAL',  // ❌ PROBLEMA
  extensaoId: null,  // ❌ PROBLEMA
  endpoint: '/api/os/c41b8ba7.../extensoes/null'  // ❌ Endpoint errado
}
```

**Causa:** O `selectedExtensionId` não está sendo passado corretamente para o `OSStatusSelect`.

### Se o endpoint estiver errado:

```
❌ PROBLEMA: Endpoint incorreto

📤 OSStatusSelect - Enviando para API: {
  endpoint: '/api/os/c41b8ba7-594a-45b6-b6a9-4c152c60406a',  // ❌ Falta /extensoes/...
  extensaoId: 'ee731db0-2cb1-4968-97dc-eb43c48e94a4'  // ✅ Tem valor mas endpoint errado
}
```

**Causa:** A lógica de construção do endpoint está incorreta.

---

## 🧪 Como Usar os Logs para Debug

### Passo 1: Abrir Console do Browser
1. Pressione `F12` no navegador
2. Vá para a aba "Console"
3. Limpe o console (ícone 🚫)

### Passo 2: Reproduzir o Problema
1. Selecione uma extensão (ex: "Amazonas")
2. Altere o status da extensão
3. Observe os logs no console

### Passo 3: Analisar os Logs
Verifique se:
- ✅ `extensaoId` tem um UUID válido em todos os logs
- ✅ `contexto` é 'EXTENSÃO' (não 'TOUR PRINCIPAL')
- ✅ `endpoint` inclui `/extensoes/[extensaoId]`
- ✅ `payload` contém o status correto

### Passo 4: Identificar o Problema
Se algum dos itens acima estiver incorreto, você identificou onde o problema está ocorrendo.

---

## 📝 Próximos Passos

1. **Testar com os logs ativos**
2. **Identificar onde o `extensaoId` está sendo perdido**
3. **Corrigir o problema específico**
4. **Remover ou comentar os logs de debug** (após resolver)

---

## 🔗 Arquivos Relacionados

- `components/os/OSStatusSelect.tsx` - Componente de seleção de status
- `app/(dashboard)/dashboard/os/[id]/page.tsx` - Página principal da OS
- `app/api/os/[id]/extensoes/[extensaoId]/route.ts` - API de extensões
- `.analysis/extension-status-save-issue.md` - Análise detalhada do problema
