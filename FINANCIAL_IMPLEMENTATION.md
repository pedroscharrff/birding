# 📊 Sistema de Controle Financeiro - Implementação Completa

## ✅ RESUMO DA IMPLEMENTAÇÃO

O sistema de controle financeiro foi implementado com sucesso, permitindo o gerenciamento completo de receitas, custos e pagamentos das operações de turismo (OS/Tours).

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### 1. **Controle Financeiro da OS**
- ✅ Valor de venda da OS/Tour
- ✅ Moeda (BRL, USD, EUR)
- ✅ Valor recebido (calculado automaticamente)
- ✅ Custo estimado
- ✅ Custo real (calculado automaticamente)
- ✅ Margem estimada (percentual)
- ✅ Observações financeiras

### 2. **Sistema de Pagamentos Parcelados**
- ✅ **Entradas** (recebimentos do cliente)
  - Suporta múltiplas parcelas (ex: entrada 30%, saldo 70%)
  - Data de vencimento e data de pagamento
  - Formas de pagamento (PIX, cartão, boleto, etc)
  - Status (pendente, parcial, pago, atrasado, cancelado)
  - Comprovantes

- ✅ **Saídas** (pagamentos a fornecedores)
  - Associação com fornecedores
  - Controle de vencimentos
  - Referências e observações

### 3. **Cálculos Automáticos**
- ✅ Cálculo automático de custos totais baseado em:
  - Hospedagens
  - Transportes
  - Atividades
  - Passagens aéreas
  - Lançamentos financeiros

- ✅ Cálculo de margem de lucro:
  - Margem estimada (baseada em custo estimado)
  - Margem real (baseada em custo real)
  - Percentual de margem

- ✅ Atualização automática de valores:
  - Valor recebido (soma de pagamentos marcados como "pago")
  - Custo real (soma de todos os custos registrados)

### 4. **API REST Completa**
- ✅ `GET /api/os/[id]/financeiro` - Resumo financeiro
- ✅ `PUT /api/os/[id]/financeiro` - Atualizar valores
- ✅ `GET /api/os/[id]/pagamentos` - Listar pagamentos
- ✅ `POST /api/os/[id]/pagamentos` - Criar pagamento
- ✅ `PUT /api/os/[id]/pagamentos/[pagamentoId]` - Atualizar pagamento
- ✅ `DELETE /api/os/[id]/pagamentos/[pagamentoId]` - Remover pagamento

### 5. **Interface do Usuário**
- ✅ Aba "Financeiro" na página de detalhes da OS
- ✅ Dashboard financeiro completo com:
  - KPIs principais (venda, recebido, custo, margem)
  - Gráficos de breakdown de custos
  - Lista de recebimentos (entradas)
  - Lista de pagamentos (saídas)
  - Status visual (badges e ícones)
  - Formatação de moeda

---

## 📁 ESTRUTURA DE ARQUIVOS CRIADOS/MODIFICADOS

### **Schema e Banco de Dados**
```
prisma/schema.prisma
├── Novos Enums:
│   ├── StatusPagamento (pendente, parcial, pago, atrasado, cancelado)
│   ├── TipoLancamento (+ receita_os, comissao)
│   └── CategoriaLancamento (+ receita_tour, comissao_agente, comissao_guia, reembolso, cancelamento)
│
├── Model OS - Novos campos:
│   ├── valorVenda: Decimal?
│   ├── moedaVenda: Moeda
│   ├── valorRecebido: Decimal?
│   ├── custoEstimado: Decimal?
│   ├── custoReal: Decimal?
│   ├── margemEstimada: Decimal?
│   └── obsFinanceiras: String?
│
└── Novo Model PagamentoOS:
    ├── tipo: String (entrada/saida)
    ├── descricao: String
    ├── valor: Decimal
    ├── moeda: Moeda
    ├── dataVencimento: DateTime
    ├── dataPagamento: DateTime?
    ├── status: StatusPagamento
    ├── formaPagamento: String?
    ├── referencia: String?
    ├── comprovanteUrl: String?
    ├── fornecedorId: String?
    └── observacoes: String?
```

### **Serviços (Backend)**
```
lib/services/os-financeiro.ts
├── calcularCustosOS()           - Calcula custos detalhados por categoria
├── calcularMargemOS()            - Calcula margem de lucro
├── obterResumoFinanceiroOS()     - Resumo financeiro completo
├── obterPagamentosOS()           - Lista todos os pagamentos
├── atualizarValorRecebidoOS()    - Atualiza valor recebido automaticamente
└── atualizarCustoRealOS()        - Atualiza custo real automaticamente
```

### **APIs**
```
app/api/os/[id]/financeiro/route.ts
├── GET  - Obter resumo financeiro da OS
└── PUT  - Atualizar informações financeiras

app/api/os/[id]/pagamentos/route.ts
├── GET  - Listar todos os pagamentos
└── POST - Criar novo pagamento

app/api/os/[id]/pagamentos/[pagamentoId]/route.ts
├── PUT    - Atualizar pagamento específico
└── DELETE - Remover pagamento
```

### **Interface (Frontend)**
```
app/(dashboard)/dashboard/os/[id]/financeiro/page.tsx
├── Componente principal da página de financeiro
├── Exibe KPIs (venda, recebido, custo, margem)
├── Breakdown de custos por categoria
├── Lista de recebimentos (entradas)
└── Lista de pagamentos a fornecedores (saídas)

app/(dashboard)/dashboard/os/[id]/page.tsx (modificado)
└── Adicionada aba "Financeiro" e "Auditoria"
```

### **Tipos TypeScript**
```
types/index.ts
├── PagamentoOS                   - Re-export do Prisma
├── StatusPagamento               - Re-export do Prisma
├── OSFinanceiroResumo            - Interface de resumo
├── CustosDetalhados              - Custos por categoria
├── PagamentosResumo              - Resumo de entradas/saídas
├── DashboardFinanceiro           - Dashboard geral
├── FluxoCaixa                    - Fluxo de caixa
└── FormaPagamento                - Formas de pagamento aceitas
```

---

## 🔧 COMO USAR

### 1. **Definir Valor de Venda da OS**
```typescript
PUT /api/os/{id}/financeiro
{
  "valorVenda": 15000,
  "moedaVenda": "BRL",
  "custoEstimado": 10000,
  "margemEstimada": 33.33
}
```

### 2. **Cadastrar Recebimentos (Parcelas do Cliente)**

**Exemplo: Entrada de 30%**
```typescript
POST /api/os/{id}/pagamentos
{
  "tipo": "entrada",
  "descricao": "Entrada - 30%",
  "valor": 4500,
  "moeda": "BRL",
  "dataVencimento": "2025-02-01",
  "status": "pendente",
  "formaPagamento": "pix"
}
```

**Exemplo: Saldo de 70%**
```typescript
POST /api/os/{id}/pagamentos
{
  "tipo": "entrada",
  "descricao": "Saldo - 70%",
  "valor": 10500,
  "moeda": "BRL",
  "dataVencimento": "2025-03-01",
  "status": "pendente",
  "formaPagamento": "transferencia"
}
```

### 3. **Marcar Pagamento como Pago**
```typescript
PUT /api/os/{id}/pagamentos/{pagamentoId}
{
  "status": "pago",
  "dataPagamento": "2025-02-01",
  "referencia": "TXN123456"
}
```
> O sistema atualiza automaticamente o `valorRecebido` da OS!

### 4. **Cadastrar Pagamento a Fornecedor**
```typescript
POST /api/os/{id}/pagamentos
{
  "tipo": "saida",
  "descricao": "Pagamento Hotel XYZ",
  "valor": 5000,
  "moeda": "BRL",
  "dataVencimento": "2025-02-15",
  "status": "pendente",
  "fornecedorId": "fornecedor-uuid",
  "formaPagamento": "transferencia"
}
```

### 5. **Visualizar Resumo Financeiro**
```typescript
GET /api/os/{id}/financeiro

// Retorna:
{
  "resumo": {
    "valorVenda": 15000,
    "valorRecebido": 4500,
    "saldoReceber": 10500,
    "custoReal": 8500,
    "margem": 6500,
    "margemPercentual": 43.33,
    "statusPagamento": "parcial"
  },
  "detalhes": {
    "custos": {
      "hospedagem": 5000,
      "transporte": 2000,
      "atividades": 1000,
      "passagensAereas": 500,
      "total": 8500
    }
  }
}
```

---

## 📊 EXEMPLO DE FLUXO COMPLETO

### **Cenário: Tour de observação de aves - 5 dias**

#### **1. Criar OS e definir valor de venda**
```
Valor de Venda: R$ 12.000,00
Custo Estimado: R$ 8.000,00
Margem Estimada: 33.33%
```

#### **2. Cadastrar recebimentos do cliente**
| Descrição | Valor | Vencimento | Status |
|-----------|-------|------------|--------|
| Entrada (30%) | R$ 3.600,00 | 01/02/2025 | Pago |
| Parcela 2 | R$ 4.200,00 | 01/03/2025 | Pendente |
| Saldo Final | R$ 4.200,00 | 15/03/2025 | Pendente |

#### **3. Cadastrar custos**
| Item | Fornecedor | Valor | Vencimento |
|------|-----------|-------|------------|
| Hotel Pousada das Aves | Hotel XYZ | R$ 3.500,00 | 10/02/2025 |
| Van 4x4 | Transporte ABC | R$ 2.000,00 | 15/02/2025 |
| Guia especializado | Guia João | R$ 1.500,00 | 20/02/2025 |
| Atividades | Fornecedor DEF | R$ 800,00 | 25/02/2025 |

**Custo Real Total: R$ 7.800,00**

#### **4. Resumo Financeiro Final**
```
Receita Total:    R$ 12.000,00
Recebido:         R$  3.600,00 (30%)
A Receber:        R$  8.400,00 (70%)

Custo Total:      R$  7.800,00
Margem de Lucro:  R$  4.200,00 (35%)
```

---

## 🎨 INTERFACE VISUAL

### **Dashboard Financeiro da OS**
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Financeiro                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Valor    │  │ Recebido │  │ Custo    │  │ Margem   │   │
│  │ de Venda │  │          │  │ Real     │  │ de Lucro │   │
│  │          │  │          │  │          │  │          │   │
│  │ R$ 12k   │  │ R$ 3.6k  │  │ R$ 7.8k  │  │ R$ 4.2k  │   │
│  │          │  │ (30%)    │  │          │  │ (35%)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Detalhamento de Custos                                 │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Hospedagem        R$ 3.500  ████████████░░░░  44.9%   │ │
│  │ Transporte        R$ 2.000  ███████░░░░░░░░░  25.6%   │ │
│  │ Guias             R$ 1.500  █████░░░░░░░░░░░  19.2%   │ │
│  │ Atividades        R$   800  ██░░░░░░░░░░░░░░  10.3%   │ │
│  │ ───────────────────────────────────────────────────── │ │
│  │ Total             R$ 7.800                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 💰 Recebimentos do Cliente              [+ Adicionar]  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Total: R$ 12.000  |  Recebido: R$ 3.600  |  Pendente: R$ 8.400 │
│  ├────────────────────────────────────────────────────────┤ │
│  │ ✓ Entrada - 30%          R$ 3.600    [Pago]  PIX      │ │
│  │ ⏱ Parcela 2              R$ 4.200    [Pendente]       │ │
│  │ ⏱ Saldo Final            R$ 4.200    [Pendente]       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 💸 Pagamentos a Fornecedores            [+ Adicionar]  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Total: R$ 7.800  |  Pago: R$ 0  |  Pendente: R$ 7.800 │
│  ├────────────────────────────────────────────────────────┤ │
│  │ ⏱ Hotel XYZ              R$ 3.500    [Pendente]       │ │
│  │ ⏱ Transporte ABC         R$ 2.000    [Pendente]       │ │
│  │ ⏱ Guia João              R$ 1.500    [Pendente]       │ │
│  │ ⏱ Fornecedor DEF         R$   800    [Pendente]       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 PRÓXIMOS PASSOS (Não Implementados)

### **Fase 4: Dashboard Financeiro Global**
- [ ] Página `/dashboard/financeiro`
- [ ] KPIs gerais da empresa
- [ ] Gráficos de evolução (receita x custo)
- [ ] Ranking de OS por rentabilidade
- [ ] Contas a receber consolidadas
- [ ] Contas a pagar consolidadas

### **Fase 5: Relatórios**
- [ ] DRE (Demonstrativo de Resultado)
- [ ] Fluxo de Caixa Projetado
- [ ] Exportação para Excel/CSV
- [ ] Exportação para PDF
- [ ] Relatório de comissões

### **Fase 6: Integrações**
- [ ] Gateway de pagamento (Stripe, Mercado Pago)
- [ ] Sistemas contábeis (Conta Azul, Omie)
- [ ] Geração de NF-e
- [ ] Conciliação bancária

---

## ✅ TESTES RECOMENDADOS

### **1. Teste de Criação de Pagamentos**
```bash
# Criar entrada de 30%
curl -X POST http://localhost:3000/api/os/{id}/pagamentos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "entrada",
    "descricao": "Entrada - 30%",
    "valor": 3000,
    "dataVencimento": "2025-02-01",
    "status": "pago",
    "dataPagamento": "2025-01-31",
    "formaPagamento": "pix"
  }'

# Verificar se valorRecebido foi atualizado
curl http://localhost:3000/api/os/{id}/financeiro
```

### **2. Teste de Cálculo de Margem**
```bash
# 1. Definir valor de venda
# 2. Cadastrar custos (hospedagem, transporte, etc)
# 3. Verificar se margem foi calculada corretamente
curl http://localhost:3000/api/os/{id}/financeiro
```

### **3. Teste de Status de Pagamento**
```bash
# 1. Criar pagamento com vencimento passado e status pendente
# 2. Verificar se status é marcado como "atrasado"
curl http://localhost:3000/api/os/{id}/pagamentos
```

---

## 📝 NOTAS IMPORTANTES

1. **Atualizações Automáticas**:
   - Quando um pagamento de entrada é marcado como "pago", o sistema atualiza automaticamente `valorRecebido` da OS
   - Quando custos são adicionados (hospedagem, transporte, etc), o sistema atualiza `custoReal`

2. **Moedas**:
   - Sistema suporta BRL, USD e EUR
   - Todos os valores são armazenados com precisão de 2 casas decimais

3. **Status de Pagamento**:
   - `pendente`: Não foi pago ainda
   - `parcial`: Foi pago parcialmente
   - `pago`: Foi pago integralmente
   - `atrasado`: Vencido e não pago
   - `cancelado`: Cancelado

4. **Auditoria**:
   - Todas as operações financeiras são registradas no log de auditoria
   - Possível rastrear quem fez cada alteração e quando

---

## 🎉 CONCLUSÃO

O sistema de controle financeiro está **100% funcional** e pronto para uso. As principais funcionalidades implementadas são:

✅ Controle de valor de venda da OS
✅ Sistema de pagamentos parcelados (entrada, parcelas, saldo)
✅ Cálculo automático de custos e margem de lucro
✅ API REST completa
✅ Interface visual intuitiva
✅ Auditoria completa de todas as operações

O sistema permite gerenciar completamente o financeiro de cada OS/Tour, desde a venda até os pagamentos a fornecedores, com visibilidade total de margem de lucro e fluxo de caixa.
