# 💳 Sistema de Controle de Despesas - Implementação Completa

## ✅ IMPLEMENTADO

Sistema completo de controle de pagamento de despesas diretamente nas entidades cadastradas (Hospedagens, Transportes, Atividades, Passagens Aéreas).

---

## 🎯 CONCEITO

**Fluxo de Operação:**
1. Cliente paga R$ 15.000 (valor da venda)
2. Você cadastra as despesas: hotel, transporte, guia, atividades
3. Com o dinheiro do cliente, você paga essas despesas
4. Sistema permite marcar cada despesa como "Paga", "Pendente", "Atrasada", etc
5. Todos os movimentos geram logs de auditoria

---

## 📋 O QUE FOI IMPLEMENTADO

### 1. **Campos de Controle de Pagamento Adicionados**

Foram adicionados em **TODAS** as tabelas de despesas:

#### Tabelas Modificadas:
- ✅ `Hospedagem`
- ✅ `Transporte`
- ✅ `Atividade`
- ✅ `PassagemAerea`

#### Novos Campos:
```prisma
statusPagamento     StatusPagamento @default(pendente)
dataPagamento       DateTime?
formaPagamento      String?  // pix, cartao, boleto, etc
referenciaPagamento String?  // Número da transação, NF, etc
```

### 2. **API de Despesas Consolidadas**

**Endpoint:** `GET /api/os/[id]/despesas`

Retorna TODAS as despesas da OS em um único lugar:
```json
{
  "despesas": [
    {
      "id": "uuid",
      "tipo": "hospedagem",
      "descricao": "Hospedagem - Hotel XYZ",
      "fornecedor": { "id": "uuid", "nomeFantasia": "Hotel XYZ" },
      "valor": 5000,
      "moeda": "BRL",
      "statusPagamento": "pendente",
      "dataPagamento": null,
      "formaPagamento": null,
      "dataReferencia": "2025-02-01"
    },
    {
      "id": "uuid",
      "tipo": "transporte",
      "descricao": "Transporte - van de São Paulo para Santos",
      "fornecedor": { "id": "uuid", "nomeFantasia": "Transporte ABC" },
      "valor": 2000,
      "moeda": "BRL",
      "statusPagamento": "pago",
      "dataPagamento": "2025-01-31",
      "formaPagamento": "pix",
      "dataReferencia": "2025-02-01"
    }
  ],
  "totais": {
    "total": 7000,
    "pago": 2000,
    "pendente": 5000,
    "porStatus": {
      "pendente": 1,
      "pago": 1,
      "atrasado": 0
    }
  }
}
```

### 3. **API para Atualizar Status de Pagamento**

**Endpoint:** `PATCH /api/os/[id]/despesas/[tipo]/[despesaId]`

**Tipos válidos:**
- `hospedagem`
- `transporte`
- `atividade`
- `passagem_aerea`

**Exemplo de uso:**
```javascript
PATCH /api/os/123/despesas/hospedagem/456
{
  "statusPagamento": "pago",
  "dataPagamento": "2025-01-31",
  "formaPagamento": "pix",
  "referenciaPagamento": "TXN123456"
}
```

### 4. **Logs de Auditoria Automáticos**

Toda alteração de status de pagamento gera um log de auditoria com:
- Quem alterou
- Quando alterou
- O que foi alterado (de/para)
- IP e User-Agent
- Tipo de despesa

---

## 🔄 FLUXO COMPLETO DE USO

### **Cenário: Tour de Observação de Aves - R$ 12.000**

#### **1. Cliente faz o pagamento**
```
Valor Total: R$ 12.000
- Entrada 30%: R$ 3.600 (pago via PIX)
- Saldo 70%: R$ 8.400 (a receber)
```

#### **2. Despesas Cadastradas**

**Hospedagem - Pousada das Aves**
```
Fornecedor: Hotel XYZ
Valor: R$ 3.500
Status: PENDENTE ⏱
```

**Transporte - Van 4x4**
```
Fornecedor: Transporte ABC
Valor: R$ 2.000
Status: PENDENTE ⏱
```

**Guia Especializado**
```
Fornecedor: João Silva
Valor: R$ 1.500
Status: PENDENTE ⏱
```

**Atividades - Trilhas e Observação**
```
Fornecedor: Turismo DEF
Valor: R$ 800
Status: PENDENTE ⏱
```

**Total de Despesas: R$ 7.800**

#### **3. Pagando as Despesas**

**DIA 31/01 - Paga hotel**
```javascript
PATCH /api/os/123/despesas/hospedagem/hotel-id
{
  "statusPagamento": "pago",
  "dataPagamento": "2025-01-31",
  "formaPagamento": "pix",
  "referenciaPagamento": "PIX20250131123456"
}

Status atualizado: PAGO ✓
Log de auditoria criado
```

**DIA 01/02 - Paga transporte**
```javascript
PATCH /api/os/123/despesas/transporte/transporte-id
{
  "statusPagamento": "pago",
  "dataPagamento": "2025-02-01",
  "formaPagamento": "transferencia",
  "referenciaPagamento": "TED123456"
}

Status atualizado: PAGO ✓
Log de auditoria criado
```

#### **4. Visualizando Resumo**

```
GET /api/os/123/despesas

Resumo:
- Total de Despesas: R$ 7.800
- Já Pago: R$ 5.500 (70%)
- Pendente: R$ 2.300 (30%)

Por Status:
- PAGO: 2 despesas
- PENDENTE: 2 despesas
- ATRASADO: 0
```

#### **5. Agrupado por Fornecedor**

```
GET /api/os/123/despesas?agruparPorFornecedor=true

Hotel XYZ:
  Total: R$ 3.500
  Pago: R$ 3.500
  Pendente: R$ 0

Transporte ABC:
  Total: R$ 2.000
  Pago: R$ 2.000
  Pendente: R$ 0

João Silva (Guia):
  Total: R$ 1.500
  Pago: R$ 0
  Pendente: R$ 1.500 ⏱

Turismo DEF:
  Total: R$ 800
  Pago: R$ 0
  Pendente: R$ 800 ⏱
```

---

## 📊 INTERFACE (A SER IMPLEMENTADA)

### **Proposta de Nova Seção na Página de Financeiro**

```
┌───────────────────────────────────────────────────────────┐
│ 💸 Despesas da Operação                     [Ver Todas]  │
├───────────────────────────────────────────────────────────┤
│  Total: R$ 7.800  |  Pago: R$ 5.500  |  Pendente: R$ 2.300 │
├───────────────────────────────────────────────────────────┤
│                                                            │
│ ✓ Hospedagem - Hotel XYZ          R$ 3.500  [Pago]       │
│   PIX • TXN123456 • Pago em 31/01/2025                   │
│                                                            │
│ ✓ Transporte - Van 4x4            R$ 2.000  [Pago]       │
│   Transferência • TED123 • Pago em 01/02/2025            │
│                                                            │
│ ⏱ Guia - João Silva               R$ 1.500  [Pendente] [Pagar] │
│                                                            │
│ ⏱ Atividade - Trilhas             R$   800  [Pendente] [Pagar] │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

**Ao clicar em [Pagar]:**
```
┌──────────────────────────────────────┐
│ Marcar como Pago                [×] │
├──────────────────────────────────────┤
│ Despesa: Guia - João Silva           │
│ Valor: R$ 1.500                      │
│                                      │
│ Data Pagamento: [31/01/2025    ] *  │
│ Forma Pgto:     [PIX ▼         ]    │
│ Referência:     [TXN789012     ]    │
│                                      │
│      [Cancelar]  [Marcar como Pago] │
└──────────────────────────────────────┘
```

---

## 🔍 AUDITORIA

Todos os logs são salvos automaticamente:

```
📝 Histórico de Pagamentos - Hospedagem Hotel XYZ

31/01/2025 14:35
Pedro Silva alterou status de pagamento
DE: pendente
PARA: pago
Forma: PIX
Referência: PIX20250131123456
IP: 192.168.1.1
```

---

## 🚀 PRÓXIMOS PASSOS (A Implementar)

### **1. Interface na Página de Financeiro**
- [ ] Adicionar seção "Despesas da Operação"
- [ ] Botões para marcar como pago em cada despesa
- [ ] Modal para editar status de pagamento
- [ ] Filtros por status (pago, pendente, atrasado)
- [ ] Filtros por fornecedor

### **2. Relatórios**
- [ ] Relatório de despesas por fornecedor
- [ ] Relatório de despesas pagas vs pendentes
- [ ] Exportação para Excel/CSV

### **3. Notificações**
- [ ] Alertas de despesas atrasadas
- [ ] Notificação ao marcar como pago

---

## 💡 VANTAGENS DESTA ABORDAGEM

### ✅ **Centralização**
Todas as despesas em um só lugar, independente do tipo

### ✅ **Rastreabilidade**
Cada mudança de status gera log de auditoria

### ✅ **Flexibilidade**
Pode marcar qualquer despesa como paga/pendente

### ✅ **Integração**
Despesas já cadastradas (hotel, transporte, atividade) automaticamente viram despesas controláveis

### ✅ **Sem Duplicação**
Não precisa cadastrar novamente - as despesas JÁ ESTÃO cadastradas nas abas de Hospedagem, Transporte, etc

---

## 🔧 ARQUIVOS CRIADOS/MODIFICADOS

**Schema:**
- ✅ `prisma/schema.prisma` - Adicionados campos de pagamento em 4 tabelas

**Serviços:**
- ✅ `lib/services/despesas.ts` - Serviço de consolidação e atualização

**APIs:**
- ✅ `app/api/os/[id]/despesas/route.ts` - Listar despesas
- ✅ `app/api/os/[id]/despesas/[tipo]/[despesaId]/route.ts` - Atualizar status

**Database:**
- ✅ Schema atualizado com `prisma db push`

---

## ✅ TESTADO E FUNCIONAL

- ✅ Campos adicionados no banco de dados
- ✅ API de listagem de despesas
- ✅ API de atualização de status
- ✅ Logs de auditoria funcionando
- ✅ Consolidação de todas as despesas em um único endpoint

---

## 📝 EXEMPLO DE TESTE

```bash
# 1. Listar todas as despesas da OS
curl http://localhost:3000/api/os/123/despesas

# 2. Marcar hospedagem como paga
curl -X PATCH http://localhost:3000/api/os/123/despesas/hospedagem/456 \
  -H "Content-Type: application/json" \
  -d '{
    "statusPagamento": "pago",
    "dataPagamento": "2025-01-31",
    "formaPagamento": "pix",
    "referenciaPagamento": "PIX123"
  }'

# 3. Ver despesas agrupadas por fornecedor
curl http://localhost:3000/api/os/123/despesas?agruparPorFornecedor=true

# 4. Verificar log de auditoria
curl http://localhost:3000/api/os/123/auditoria
```

---

## 🎉 CONCLUSÃO

O sistema de controle de despesas está **100% funcional no backend**. As APIs estão prontas e testadas.

**Falta apenas:**
- Interface para exibir as despesas na página de Financeiro
- Botões de ação para marcar como pago
- Modal de edição de status

O backend já suporta tudo isso! 🚀
