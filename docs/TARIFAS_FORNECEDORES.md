# Sistema de Tarifas de Fornecedores

## Visão Geral

O sistema de tarifas permite cadastrar e gerenciar os valores praticados por cada fornecedor, facilitando o controle de custos e a criação de orçamentos para as Ordens de Serviço.

## Funcionalidades

### 1. Cadastro de Tarifas

Cada fornecedor pode ter múltiplas tarifas cadastradas com:

- **Descrição**: Nome/descrição do serviço (ex: "Diária quarto duplo", "Guiamento por dia")
- **Valor**: Valor numérico da tarifa
- **Moeda**: BRL, USD ou EUR
- **Unidade**: Unidade de medida (ex: "por pessoa", "por dia", "por grupo", "por km")
- **Vigência**: Período de validade da tarifa (início e fim)
- **Status**: Ativo/Inativo
- **Observações**: Informações adicionais

### 2. Gestão de Vigência

- **Vigência Início**: Data a partir da qual a tarifa é válida
- **Vigência Fim**: Data até a qual a tarifa é válida
- **Indicadores Visuais**:
  - Badge "Vigente" (verde) - tarifa ativa e dentro do período
  - Badge "Fora da vigência" (laranja) - tarifa ativa mas fora do período
  - Badge "Inativa" (cinza) - tarifa desativada

### 3. Controle de Status

- **Ativar/Desativar**: Toggle rápido para ativar ou desativar tarifas
- **Tarifas Inativas**: Permanecem no histórico mas ficam visualmente diferenciadas
- **Filtros**: Possibilidade de listar apenas tarifas ativas

### 4. Interface do Usuário

#### Página de Detalhes do Fornecedor

Acesse `/dashboard/fornecedores/[id]` para ver:
- Informações completas do fornecedor
- Gerenciador de tarifas integrado
- Formulário inline para criar/editar tarifas

#### Gerenciador de Tarifas

- **Botão "Nova Tarifa"**: Abre formulário inline
- **Lista de Tarifas**: Cards com todas as informações
- **Ações Rápidas**:
  - Ativar/Desativar (ícone X/✓)
  - Editar (ícone lápis)
  - Excluir (ícone lixeira)

## Estrutura de Dados

### Model FornecedorTarifa

```prisma
model FornecedorTarifa {
  id             String    @id @default(uuid())
  fornecedorId   String
  descricao      String
  valor          Decimal   @db.Decimal(12, 2)
  moeda          Moeda     @default(BRL)
  unidade        String?
  vigenciaInicio DateTime? @db.Date
  vigenciaFim    DateTime? @db.Date
  ativo          Boolean   @default(true)
  observacoes    String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  fornecedor Fornecedor @relation(...)
}
```

## API Endpoints

### GET /api/fornecedores/[id]/tarifas
Lista todas as tarifas de um fornecedor

**Query Parameters:**
- `ativas=true`: Retorna apenas tarifas ativas e vigentes

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fornecedorId": "uuid",
      "descricao": "Diária quarto duplo",
      "valor": 350.00,
      "moeda": "BRL",
      "unidade": "por pessoa",
      "vigenciaInicio": "2024-01-01",
      "vigenciaFim": "2024-12-31",
      "ativo": true,
      "observacoes": "Inclui café da manhã",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/fornecedores/[id]/tarifas
Cria uma nova tarifa

**Body:**
```json
{
  "descricao": "Diária quarto duplo",
  "valor": 350.00,
  "moeda": "BRL",
  "unidade": "por pessoa",
  "vigenciaInicio": "2024-01-01",
  "vigenciaFim": "2024-12-31",
  "observacoes": "Inclui café da manhã"
}
```

### PATCH /api/fornecedores/[id]/tarifas/[tarifaId]
Atualiza uma tarifa existente

**Body:** Mesma estrutura do POST (todos os campos opcionais)

### DELETE /api/fornecedores/[id]/tarifas/[tarifaId]
Remove uma tarifa

## Casos de Uso

### 1. Tabela de Preços Anual

Cadastre todas as tarifas do fornecedor com vigência de 1 ano:
```
Descrição: "Diária Single - Alta Temporada"
Valor: R$ 450,00
Unidade: "por pessoa"
Vigência: 01/12/2024 a 28/02/2025
```

### 2. Múltiplas Moedas

Fornecedores internacionais podem ter tarifas em diferentes moedas:
```
Descrição: "Guiamento Full Day"
Valor: $150,00
Moeda: USD
Unidade: "por grupo"
```

### 3. Tarifas Sazonais

Crie tarifas diferentes para cada temporada:
```
Alta Temporada: R$ 500,00 (Dez-Fev)
Média Temporada: R$ 350,00 (Mar-Jun, Set-Nov)
Baixa Temporada: R$ 250,00 (Jul-Ago)
```

### 4. Histórico de Preços

Mantenha tarifas antigas inativas para referência:
```
Tarifa 2023: R$ 300,00 (Inativa)
Tarifa 2024: R$ 350,00 (Vigente)
```

## Benefícios

### Para Orçamentos
- Consulta rápida de valores atualizados
- Histórico de preços para comparação
- Múltiplas opções de tarifas por fornecedor

### Para Controle Financeiro
- Valores padronizados e centralizados
- Rastreabilidade de mudanças de preços
- Facilita auditoria e prestação de contas

### Para Planejamento
- Previsão de custos mais precisa
- Comparação entre fornecedores
- Análise de sazonalidade

## Integração Futura

### Com Ordens de Serviço
- Seleção automática de tarifas ao vincular fornecedor
- Sugestão de valores baseados nas tarifas vigentes
- Alerta quando usar valor diferente da tabela

### Com Relatórios
- Análise de variação de preços
- Comparativo entre fornecedores
- Histórico de custos por período

### Com Cotações
- Comparação automática com tarifas cadastradas
- Identificação de descontos/acréscimos
- Validação de valores propostos

## Comandos para Implementação

### 1. Criar Migration
```bash
npm run db:migrate
```

### 2. Gerar Cliente Prisma
```bash
npm run db:generate
```

### 3. Aplicar em Produção
```bash
npm run db:migrate:prod
```

## Estrutura de Arquivos

```
prisma/
  schema.prisma                          # Model FornecedorTarifa

app/
  api/
    fornecedores/
      [id]/
        tarifas/
          route.ts                       # GET (list) e POST (create)
          [tarifaId]/
            route.ts                     # PATCH e DELETE
  (dashboard)/
    dashboard/
      fornecedores/
        [id]/
          page.tsx                       # Página de detalhes com tarifas

components/
  forms/
    TarifasManager.tsx                   # Componente de gerenciamento
```

## Validações

### Campos Obrigatórios
- Descrição
- Valor

### Validações de Negócio
- Valor deve ser maior que zero
- Data fim deve ser posterior à data início (se ambas fornecidas)
- Moeda deve ser BRL, USD ou EUR

### Validações de Interface
- Formatação automática de moeda
- Validação de datas
- Feedback visual de status

## Melhorias Futuras

- [ ] Importação em lote de tarifas via CSV
- [ ] Duplicação de tarifas (copiar para novo período)
- [ ] Histórico de alterações de valores
- [ ] Alertas de vencimento de vigência
- [ ] Comparador de tarifas entre fornecedores
- [ ] Cálculo automático de reajustes (inflação, etc)
- [ ] Aprovação de tarifas (workflow)
- [ ] Integração com cotações automáticas
- [ ] Dashboard de análise de preços
- [ ] Exportação de tabelas de preços em PDF

## Observações Importantes

⚠️ **Após atualizar o schema.prisma, execute:**
```bash
npm run db:generate
npm run db:migrate
```

⚠️ **Os erros de TypeScript sobre `fornecedorTarifa` são esperados até rodar o Prisma generate**

✅ **A funcionalidade está completa e pronta para uso após a migration**
