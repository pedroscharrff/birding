# 🎛️ Políticas Configuráveis - Regras de Negócio Dinâmicas

## ✅ IMPLEMENTADO

Sistema completo de políticas configuráveis por organização, permitindo que cada empresa defina suas próprias regras de negócio, com versionamento e rastreabilidade total.

---

## 🎯 CONCEITO

Transformamos as regras fixas em **políticas versionadas e editáveis**, onde:
- Cada organização pode ter múltiplas políticas (versões)
- Apenas uma política está ativa por vez
- Cada mudança de status da OS registra qual política foi usada (snapshot)
- Histórico completo de quais regras foram aplicadas em cada OS

---

## 📋 O QUE FOI CRIADO

### 1. **Modelos de Dados** (`prisma/schema.prisma`)

#### `OrganizacaoPolicy`
```prisma
model OrganizacaoPolicy {
  id          String     @id @default(uuid())
  orgId       String
  nome        String
  descricao   String?
  versao      Int        @default(1)
  ativa       Boolean    @default(false)
  
  // Configurações (JSON para flexibilidade)
  financeiro  Json       // margemMinimaPercentual, entradaMinimaPercentual, toleranciaCustoRealAcimaEstimadoPercentual
  prazos      Json       // prazoMinimoGuiaDias, prazoMinimoMotoristaDias, prazoMinimoHospedagemDias
  checklistsOverrides Json?  // Overrides personalizados por transição
  
  createdAt   DateTime
  updatedAt   DateTime
}
```

#### `OSPolicySnapshot`
```prisma
model OSPolicySnapshot {
  id        String   @id @default(uuid())
  osId      String
  policyId  String
  versao    Int
  snapshot  Json     // Cópia imutável da política no momento da aplicação
  appliedAt DateTime
}
```

### 2. **Serviço de Políticas** (`lib/services/policy.ts`)

#### Valores Padrão
```typescript
const DEFAULT_FINANCEIRO = {
  margemMinimaPercentual: 15,
  entradaMinimaPercentual: 30,
  toleranciaCustoRealAcimaEstimadoPercentual: 20,
}

const DEFAULT_PRAZOS = {
  prazoMinimoGuiaDias: 15,
  prazoMinimoMotoristaDias: 10,
  prazoMinimoHospedagemDias: 7,
}
```

#### Funções Principais
```typescript
// Buscar política ativa (retorna default se não houver)
getActivePolicy(orgId: string)

// Listar todas as políticas da organização
listPolicies(orgId: string)

// Criar nova versão de política
createPolicy(input: OrganizacaoPolicyInput)

// Atualizar política existente
updatePolicy(id: string, input: Partial<OrganizacaoPolicyInput>)

// Ativar uma política (desativa as outras)
activatePolicy(orgId: string, id: string)

// Salvar snapshot da política usada em uma OS
snapshotPolicyForOS(osId: string, policyId: string)
```

### 3. **APIs REST**

#### `GET /api/policies?orgId={orgId}`
Lista todas as políticas da organização
```json
[
  {
    "id": "uuid",
    "orgId": "uuid",
    "nome": "Política Padrão 2025",
    "descricao": "Regras atualizadas para 2025",
    "versao": 2,
    "ativa": true,
    "financeiro": {
      "margemMinimaPercentual": 18,
      "entradaMinimaPercentual": 35,
      "toleranciaCustoRealAcimaEstimadoPercentual": 15
    },
    "prazos": {
      "prazoMinimoGuiaDias": 20,
      "prazoMinimoMotoristaDias": 12,
      "prazoMinimoHospedagemDias": 10
    },
    "createdAt": "2025-01-31T10:00:00Z",
    "updatedAt": "2025-01-31T10:00:00Z"
  }
]
```

#### `POST /api/policies`
Cria nova versão de política
```json
// Request
{
  "orgId": "uuid",
  "nome": "Política Alta Temporada",
  "descricao": "Regras mais rígidas para alta temporada",
  "financeiro": {
    "margemMinimaPercentual": 20,
    "entradaMinimaPercentual": 40
  },
  "prazos": {
    "prazoMinimoGuiaDias": 30
  }
}

// Response: política criada com versão incrementada
```

#### `GET /api/policies/[id]`
Busca política específica

#### `PUT /api/policies/[id]`
Atualiza política existente

#### `POST /api/policies/[id]/activate`
Ativa uma política (desativa as outras automaticamente)

### 4. **Integração com Validações**

O serviço `status-validation.ts` agora:
- Carrega a política ativa da organização
- Usa os valores da política para validações dinâmicas
- Não mais depende de constantes fixas

**Antes:**
```typescript
// Valores fixos
const MARGEM_MINIMA_PERCENTUAL = 15
const ENTRADA_MINIMA_PERCENTUAL = 30
```

**Depois:**
```typescript
// Valores dinâmicos da política ativa
const policy = await getActivePolicy(os.orgId)
const financeiro = policy.financeiro as FinanceiroPolicy
const prazos = policy.prazos as PrazosPolicy

// Usar nos checklists
if (margem >= financeiro.margemMinimaPercentual) { ... }
if (diasAteInicio > prazos.prazoMinimoGuiaDias) { ... }
```

---

## 🚀 COMO USAR

### 1. Criar Nova Política

```typescript
const response = await fetch('/api/policies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgId: 'minha-org-id',
    nome: 'Política Conservadora',
    descricao: 'Regras mais rígidas para reduzir riscos',
    financeiro: {
      margemMinimaPercentual: 25,  // Margem mínima de 25%
      entradaMinimaPercentual: 50,  // Entrada mínima de 50%
      toleranciaCustoRealAcimaEstimadoPercentual: 10  // Tolerância de apenas 10%
    },
    prazos: {
      prazoMinimoGuiaDias: 30,      // Guia com 30 dias de antecedência
      prazoMinimoMotoristaDias: 20,  // Motorista com 20 dias
      prazoMinimoHospedagemDias: 15  // Hospedagens com 15 dias
    }
  })
})
```

### 2. Ativar Política

```typescript
await fetch(`/api/policies/${policyId}/activate`, {
  method: 'POST'
})
```

### 3. Listar Políticas

```typescript
const policies = await fetch(`/api/policies?orgId=${orgId}`)
  .then(r => r.json())

// Políticas vêm ordenadas: ativa primeiro, depois por versão decrescente
```

### 4. Editar Política

```typescript
await fetch(`/api/policies/${policyId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Política Atualizada',
    financeiro: {
      margemMinimaPercentual: 18
    }
  })
})
```

---

## 📊 EXEMPLOS DE POLÍTICAS

### Política Conservadora (Baixo Risco)
```json
{
  "nome": "Conservadora",
  "financeiro": {
    "margemMinimaPercentual": 25,
    "entradaMinimaPercentual": 50,
    "toleranciaCustoRealAcimaEstimadoPercentual": 10
  },
  "prazos": {
    "prazoMinimoGuiaDias": 30,
    "prazoMinimoMotoristaDias": 20,
    "prazoMinimoHospedagemDias": 15
  }
}
```

### Política Agressiva (Alto Volume)
```json
{
  "nome": "Agressiva",
  "financeiro": {
    "margemMinimaPercentual": 10,
    "entradaMinimaPercentual": 20,
    "toleranciaCustoRealAcimaEstimadoPercentual": 30
  },
  "prazos": {
    "prazoMinimoGuiaDias": 7,
    "prazoMinimoMotoristaDias": 5,
    "prazoMinimoHospedagemDias": 3
  }
}
```

### Política Balanceada (Padrão)
```json
{
  "nome": "Balanceada",
  "financeiro": {
    "margemMinimaPercentual": 15,
    "entradaMinimaPercentual": 30,
    "toleranciaCustoRealAcimaEstimadoPercentual": 20
  },
  "prazos": {
    "prazoMinimoGuiaDias": 15,
    "prazoMinimoMotoristaDias": 10,
    "prazoMinimoHospedagemDias": 7
  }
}
```

---

## 🔍 RASTREABILIDADE E AUDITORIA

### Snapshot de Política

Quando uma OS muda de status (após validação bem-sucedida), o sistema salva um snapshot da política usada:

```typescript
// Ao aprovar mudança de status
const policy = await getActivePolicy(os.orgId)
await snapshotPolicyForOS(os.id, policy.id)

// Snapshot salvo:
{
  "osId": "os-123",
  "policyId": "policy-456",
  "versao": 2,
  "snapshot": {
    "financeiro": { "margemMinimaPercentual": 15, ... },
    "prazos": { "prazoMinimoGuiaDias": 15, ... }
  },
  "appliedAt": "2025-01-31T14:30:00Z"
}
```

### Benefícios
- ✅ **Reprodutibilidade**: Saber exatamente quais regras foram aplicadas
- ✅ **Auditoria**: Histórico completo de políticas usadas
- ✅ **Imutabilidade**: Mudanças futuras não afetam validações passadas
- ✅ **Compliance**: Rastreamento para auditorias e certificações

---

## 🎨 INTERFACE (A SER IMPLEMENTADA)

### Página de Configurações: `/dashboard/config/policies`

```
┌─────────────────────────────────────────────────────────────┐
│ 🎛️ Políticas de Negócio                    [+ Nova Política] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✓ Política Padrão 2025                          v2  [ATIVA] │
│   Regras atualizadas para 2025                              │
│   Margem: 18% | Entrada: 35% | Guia: 20 dias               │
│   [Editar]  [Ver Detalhes]                                  │
│                                                              │
│   Política Conservadora                         v1           │
│   Regras mais rígidas para reduzir riscos                   │
│   Margem: 25% | Entrada: 50% | Guia: 30 dias               │
│   [Ativar]  [Editar]  [Clonar]                              │
│                                                              │
│   Política Alta Temporada                       v1           │
│   Regras para períodos de alta demanda                      │
│   Margem: 20% | Entrada: 40% | Guia: 25 dias               │
│   [Ativar]  [Editar]  [Clonar]                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Modal de Edição

```
┌─────────────────────────────────────────────┐
│ Editar Política: Padrão 2025           [×] │
├─────────────────────────────────────────────┤
│                                              │
│ Nome:        [Política Padrão 2025      ]  │
│ Descrição:   [Regras atualizadas...     ]  │
│                                              │
│ 💰 Configurações Financeiras                │
│ ├─ Margem Mínima:        [18] %            │
│ ├─ Entrada Mínima:       [35] %            │
│ └─ Tolerância Custo:     [15] %            │
│                                              │
│ ⏱️ Prazos Operacionais                      │
│ ├─ Prazo Guia:           [20] dias         │
│ ├─ Prazo Motorista:      [12] dias         │
│ └─ Prazo Hospedagem:     [10] dias         │
│                                              │
│ 📋 Checklists Personalizados (Avançado)     │
│ [Configurar Overrides...]                   │
│                                              │
│        [Cancelar]  [Salvar como Nova Versão]│
└─────────────────────────────────────────────┘
```

---

## 💡 CASOS DE USO

### 1. **Mudança Sazonal**
```
Alta Temporada (Dez-Fev):
- Ativar "Política Alta Temporada"
- Margem maior, entrada maior, prazos mais longos

Baixa Temporada (Mar-Nov):
- Ativar "Política Flexível"
- Margem menor, entrada menor, prazos mais curtos
```

### 2. **Segmentação por Tipo de Cliente**
```
Clientes Corporativos:
- Política com prazos mais curtos
- Margem menor (volume compensa)

Clientes Individuais:
- Política com prazos mais longos
- Margem maior (mais trabalho)
```

### 3. **Teste A/B de Regras**
```
Criar versão experimental:
- Clonar política atual
- Ajustar parâmetros
- Ativar por período de teste
- Comparar resultados
- Decidir manter ou reverter
```

---

## 🔧 PRÓXIMOS PASSOS

### MVP (Já Implementado)
- ✅ Modelos de dados
- ✅ Serviço de políticas
- ✅ APIs REST
- ✅ Integração com validações
- ✅ Versionamento automático

### Fase 2 (A Implementar)
- [ ] Interface de configurações
- [ ] Editor visual de políticas
- [ ] Clonagem de políticas
- [ ] Histórico de ativações
- [ ] Comparação entre versões

### Fase 3 (Futuro)
- [ ] Templates de políticas por segmento
- [ ] Overrides de checklist por transição
- [ ] Políticas com vigência temporal (auto-ativação)
- [ ] Simulador de impacto de mudanças
- [ ] Exportação/importação de políticas

---

## ✅ CONCLUSÃO

O sistema de políticas configuráveis está **100% funcional no backend**:
- ✅ Banco de dados criado e migrado
- ✅ Serviços implementados
- ✅ APIs expostas
- ✅ Integração com validações completa
- ✅ Versionamento e rastreabilidade

**Falta apenas:**
- Interface de configurações (página de políticas)
- Editor visual (pode começar com JSON e evoluir)

**Benefícios imediatos:**
- Cada organização pode ter suas próprias regras
- Mudanças de regras não afetam OS antigas (snapshots)
- Flexibilidade total para ajustar o negócio
- Rastreabilidade completa para auditoria
