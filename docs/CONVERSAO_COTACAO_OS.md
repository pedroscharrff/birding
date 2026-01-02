# Sistema de Conversão de Cotações para OS/TOURS

## Visão Geral

O sistema permite converter cotações rápidas em Ordens de Serviço (OS/TOURS) completas, facilitando o processo de transformar uma proposta aceita pelo cliente em um tour operacional.

## Arquitetura

### 1. Função de Conversão (`lib/cotacao-converter.ts`)

A função principal `converterCotacaoParaOS` realiza a conversão completa de uma cotação para OS.

#### Mapeamento de Dados

**Cotação → OS:**
- `titulo` → `titulo`
- `destino` → `destino`
- `dataInicio` → `dataInicio`
- `dataFim` → `dataFim`
- `observacoesCliente` → `descricao`
- Status inicial: `planejamento`
- `custoEstimado`: soma de todos os itens

**Cliente → Participante:**
- `clienteNome` → `nome`
- `clienteEmail` → `email`
- `clienteTelefone` → `telefone`
- `observacoesInternas` → `observacoes`

**Hospedagens:**
- Apenas itens com `fornecedorId` são convertidos
- `quantidade` (noites) → cálculo de `checkin` e `checkout`
- `descricao` → `hotelNome`
- `subtotal` → `custoTotal`
- `tarifaId` → vinculação com tarifa do fornecedor
- `statusPagamento`: `pendente`

**Atividades:**
- `descricao` → `nome`
- `subtotal` → `valor`
- `quantidade` → `quantidadeMaxima`
- `fornecedorId` → vinculação com fornecedor (opcional)
- `statusPagamento`: `pendente`

**Transportes:**
- `tipo`: padrão `van`
- `subtotal` → `custo`
- `fornecedorId` → vinculação com fornecedor (opcional)
- Detalhes armazenados em JSON
- `statusPagamento`: `pendente`

**Alimentação:**
- Convertida como `Atividade` com prefixo "Alimentação:"
- Mesmo mapeamento das atividades

### 2. Endpoint API (`/api/cotacoes/[id]/converter-para-os`)

**Método:** POST

**Autenticação:** Requerida (via `requireAuth`)

**Body:**
```json
{
  "cotacao": {
    "id": "string",
    "titulo": "string",
    "clienteNome": "string",
    "clienteEmail": "string",
    "clienteTelefone": "string",
    "destino": "string",
    "dataInicio": "YYYY-MM-DD",
    "dataFim": "YYYY-MM-DD",
    "statusCotacao": "string",
    "observacoesInternas": "string",
    "observacoesCliente": "string",
    "hospedagens": [CotacaoItem],
    "atividades": [CotacaoItem],
    "transportes": [CotacaoItem],
    "alimentacoes": [CotacaoItem]
  }
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "osId": "uuid",
  "participanteId": "uuid",
  "hospedagensIds": ["uuid"],
  "atividadesIds": ["uuid"],
  "transportesIds": ["uuid"],
  "warnings": ["string"],
  "message": "OS criada com sucesso!"
}
```

**Resposta de Erro (400/500):**
```json
{
  "error": "Mensagem de erro",
  "details": "Detalhes técnicos"
}
```

### 3. Interface do Usuário

**Localização:** `/dashboard/cotacoes/[id]`

**Botão de Conversão:**
- Visível apenas para cotações com status `rascunho` ou `enviada`
- Confirmação antes da conversão
- Exibe avisos se houver itens sem fornecedor
- Redireciona para a OS criada após sucesso

## Avisos (Warnings)

O sistema gera avisos nas seguintes situações:

1. **Hospedagem sem fornecedor:** Item não será convertido
2. **Alimentação sem fornecedor:** Item será convertido como atividade sem fornecedor

## Validações

### Dados Obrigatórios:
- `titulo`
- `clienteNome`
- `destino`
- `orgId`
- `agenteResponsavelId`

### Dados Opcionais:
- `dataInicio` (padrão: data atual)
- `dataFim` (padrão: 7 dias após início)
- `clienteEmail` (gerado automaticamente se não fornecido)
- `clienteTelefone`
- `observacoesInternas`
- `observacoesCliente`

## Fluxo de Conversão

```
1. Usuário clica em "Converter em OS"
   ↓
2. Confirmação do usuário
   ↓
3. Coleta de dados da cotação
   ↓
4. Envio para API /api/cotacoes/[id]/converter-para-os
   ↓
5. Validação de autenticação
   ↓
6. Construção de dados da OS
   ↓
7. Criação da OS no banco de dados
   ↓
8. Criação do participante
   ↓
9. Criação de hospedagens (se houver)
   ↓
10. Criação de atividades (se houver)
    ↓
11. Criação de transportes (se houver)
    ↓
12. Retorno de IDs criados e avisos
    ↓
13. Exibição de mensagens de sucesso/avisos
    ↓
14. Redirecionamento para /dashboard/os/[osId]
```

## Exemplos de Uso

### Exemplo 1: Cotação Completa

```typescript
const cotacao = {
  id: "cot-123",
  titulo: "Tour Pantanal - 7 dias",
  clienteNome: "João Silva",
  clienteEmail: "joao@email.com",
  destino: "Bonito, MS",
  dataInicio: "2026-07-15",
  dataFim: "2026-07-22",
  hospedagens: [
    {
      id: "h1",
      fornecedorId: "forn-hotel-1",
      tarifaId: "tarifa-1",
      descricao: "Hotel Fazenda - Quarto Duplo",
      quantidade: 6,
      valorUnitario: 450,
      moeda: "BRL",
      subtotal: 2700
    }
  ],
  atividades: [
    {
      id: "a1",
      fornecedorId: "forn-guia-1",
      descricao: "Safari Fotográfico",
      quantidade: 4,
      valorUnitario: 350,
      moeda: "BRL",
      subtotal: 1400
    }
  ]
}

// Resultado:
// - OS criada com status "planejamento"
// - 1 participante criado
// - 1 hospedagem criada (6 noites)
// - 1 atividade criada
// - Custo estimado: R$ 4.100,00
```

### Exemplo 2: Cotação com Avisos

```typescript
const cotacao = {
  // ... dados básicos
  hospedagens: [
    {
      id: "h1",
      // SEM fornecedorId
      descricao: "Hotel sem fornecedor",
      quantidade: 3,
      valorUnitario: 300,
      moeda: "BRL",
      subtotal: 900
    }
  ]
}

// Resultado:
// - OS criada
// - Warning: "Hospedagem 'Hotel sem fornecedor' não possui fornecedor vinculado e não será convertida"
// - Hospedagem NÃO criada
```

## Integração com Sistema de Tarifas

O sistema mantém a vinculação com tarifas de fornecedores:

- Se a cotação foi criada usando uma tarifa, o `tarifaId` é preservado
- A hospedagem criada mantém referência à tarifa original
- Facilita rastreamento de preços e condições comerciais

## Próximos Passos

### Melhorias Futuras:
1. Adicionar validação de disponibilidade de fornecedores
2. Criar histórico de conversões
3. Permitir edição antes da conversão
4. Adicionar opção de criar múltiplos participantes
5. Implementar templates de conversão personalizados
6. Adicionar cálculo automático de margem de lucro
7. Integrar com sistema de aprovações

## Troubleshooting

### Erro: "Dados da cotação são obrigatórios"
**Causa:** Body da requisição não contém o objeto `cotacao`
**Solução:** Verificar estrutura do JSON enviado

### Erro: "Não autorizado"
**Causa:** Sessão expirada ou inválida
**Solução:** Fazer login novamente

### Hospedagens não aparecem na OS
**Causa:** Itens sem `fornecedorId` não são convertidos
**Solução:** Vincular fornecedor antes da conversão

### Data de checkout incorreta
**Causa:** Cálculo baseado em `quantidade` (noites)
**Solução:** Verificar se a quantidade de noites está correta na cotação
