# 🔄 Sistema Unificado de Detecção de Guias

## 🎯 Problema Resolvido

O sistema agora **detecta automaticamente** guias de AMBAS as formas:
- ✅ Guias internos (designação via `guiasDesignacao`)
- ✅ Guias externos (fornecedores tipo `guiamento`)

Todos os alertas, validações e regras de negócio foram atualizados para considerar **ambas as fontes**.

---

## 🔧 Implementação Técnica

### Novo Helper: `guia-detection.ts`

Arquivo: [lib/utils/guia-detection.ts](lib/utils/guia-detection.ts)

Funções disponíveis:

```typescript
// Detecção completa com query ao banco
const resultado = await detectarGuiasNaOS(osId)
console.log(resultado.temGuia) // true se tiver QUALQUER guia
console.log(resultado.total) // total de guias (internos + externos)
console.log(resultado.detalhes) // lista completa separada por tipo

// Versão simplificada
const temGuia = await osTemGuia(osId)

// A partir de dados já carregados (melhor performance)
const temGuia = detectarGuiasFromData({
  guiasDesignacao: os.guiasDesignacao,
  fornecedores: os.fornecedores,
})

// Contador detalhado
const { internos, externos, total } = contarGuiasFromData({
  guiasDesignacao: os.guiasDesignacao,
  fornecedores: os.fornecedores,
})
```

---

## ✅ Arquivos Atualizados

### 1. **Validações de Status** (`lib/services/status-validation.ts`)

**ANTES:**
```typescript
case 'guias':
  return os.guiasDesignacao && os.guiasDesignacao.length > 0 // ❌ Só interno
```

**DEPOIS:**
```typescript
case 'guias':
  return detectarGuiasFromData({
    guiasDesignacao: os.guiasDesignacao,
    fornecedores: os.fornecedores,  // ✅ Interno OU externo
  })
```

### 2. **Sistema de Alertas** (`lib/services/alerts.ts`)

**ANTES:**
```typescript
if (diasAteInicio <= 15 && os.guiasDesignacao.length === 0) {
  // ❌ Alerta mesmo se tiver guia fornecedor
  alerts.push({ ... })
}
```

**DEPOIS:**
```typescript
const contadorGuias = contarGuiasFromData({
  guiasDesignacao: os.guiasDesignacao,
  fornecedores: os.fornecedores,
})

if (diasAteInicio <= 15 && contadorGuias.total === 0) {
  // ✅ Só alerta se não tiver NENHUM tipo de guia
  alerts.push({ ... })
}
```

---

## 📊 Estrutura de Retorno

### `detectarGuiasNaOS(osId)`

```json
{
  "temGuia": true,
  "guiasInternos": 2,
  "guiasExternos": 1,
  "total": 3,
  "detalhes": {
    "internos": [
      {
        "id": "uuid-1",
        "nome": "João Silva",
        "tipo": "interno",
        "funcao": "Guia Principal"
      },
      {
        "id": "uuid-2",
        "nome": "Maria Santos",
        "tipo": "interno",
        "funcao": null
      }
    ],
    "externos": [
      {
        "id": "uuid-3",
        "nome": "Carlos Oliveira - Guiamento",
        "tipo": "externo",
        "fornecedorId": "uuid-4"
      }
    ]
  }
}
```

---

## 🎬 Cenários de Uso

### Cenário 1: Apenas Guia Interno
```typescript
OS {
  guiasDesignacao: [{ id: "...", guiaId: "..." }],
  fornecedores: []
}

// Resultado
detectarGuiasFromData(os) // ✅ true
contadorGuias.total // 1
```

### Cenário 2: Apenas Guia Externo
```typescript
OS {
  guiasDesignacao: [],
  fornecedores: [{ categoria: "guiamento", ... }]
}

// Resultado
detectarGuiasFromData(os) // ✅ true
contadorGuias.total // 1
```

### Cenário 3: Ambos
```typescript
OS {
  guiasDesignacao: [{ id: "...", guiaId: "..." }],
  fornecedores: [
    { categoria: "guiamento", ... },
    { categoria: "hospedagem", ... }  // Não conta
  ]
}

// Resultado
detectarGuiasFromData(os) // ✅ true
contadorGuias.total // 2 (1 interno + 1 externo)
```

### Cenário 4: Nenhum
```typescript
OS {
  guiasDesignacao: [],
  fornecedores: [{ categoria: "hospedagem", ... }]
}

// Resultado
detectarGuiasFromData(os) // ❌ false
contadorGuias.total // 0
```

---

## 🔍 Checklist de Validação

Quando uma OS precisa ter guia designado, o sistema verifica:

- [x] Existe `GuiaDesignacao` vinculado?
- [x] Existe `OSFornecedor` com categoria = "guiamento"?
- [x] Pelo menos um dos dois = ✅ OS tem guia

---

## 🚀 Performance

### Otimizações Implementadas

1. **Função `detectarGuiasFromData`**
   - Usa dados já carregados em memória
   - Zero queries adicionais ao banco
   - Ideal para validações em lote

2. **Função `detectarGuiasNaOS`**
   - Faz 2 queries otimizadas
   - Retorna detalhes completos
   - Ideal para dashboards e relatórios

3. **Função `osTemGuia`**
   - Versão simplificada
   - Retorna apenas booleano
   - Ideal para validações simples

---

## 📋 Impacto nos Fluxos

### ✅ Alertas
- Alerta "OS sem guia" só dispara se não tiver **nenhum** tipo de guia
- Considera prazo de 15 dias antes do início

### ✅ Validações de Status
- Checklist de transição para "pronto_para_viagem"
- Respeita `prazoMinimoGuiaDias` da política ativa
- Aceita guia interno OU externo

### ✅ Dashboards e Relatórios
- Contadores de guias mostram total unificado
- Possível filtrar por tipo (interno/externo)

---

## 🧪 Como Testar

### Teste 1: Guia Interno
```bash
1. Acesse OS → Aba "Guias"
2. Adicione um guia interno
3. Verifique que alerta "OS sem guia" desaparece
4. Tente avançar status → Validação deve passar
```

### Teste 2: Guia Externo
```bash
1. Remova guias internos da OS
2. Acesse Dashboard → Fornecedores
3. Adicione fornecedor tipo "Guiamento" à OS
4. Verifique que alerta "OS sem guia" desaparece
5. Tente avançar status → Validação deve passar
```

### Teste 3: Ambos
```bash
1. Adicione guia interno E fornecedor guiamento
2. Contador deve mostrar 2 guias
3. Sistema aceita qualquer um dos dois
```

### Teste 4: Nenhum
```bash
1. Remova todos os guias (internos e externos)
2. Alerta deve aparecer se faltarem < 15 dias
3. Validação de status deve bloquear
```

---

## 📝 Exemplo Real

```typescript
// API de validação de status
const validation = await validateStatusTransition(
  osId,
  'reservas_confirmadas',
  'pronto_para_viagem'
)

// Checklist item "guias"
{
  label: "Guia designado",
  completed: true,  // ✅ true porque tem fornecedor tipo "guiamento"
  required: true
}

// Sistema de alertas
{
  alerts: [
    // ✅ Não mostra alerta "OS sem guia" porque tem fornecedor
  ]
}
```

---

## 🎯 Benefícios

1. **Flexibilidade**
   - Use guias internos, externos ou ambos
   - Sistema se adapta automaticamente

2. **Consistência**
   - Todas as regras usam mesma lógica
   - Sem duplicação de código

3. **Performance**
   - Queries otimizadas
   - Reutilização de dados já carregados

4. **Manutenibilidade**
   - Lógica centralizada em um helper
   - Fácil de atualizar e testar

---

**Última atualização:** 01/11/2025
**Versão:** 2.0.0 (Unificado)
