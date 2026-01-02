# Migration: Sistema de Cotações

## Problema Identificado

O sistema de cotações estava usando dados mock (não salvava no banco de dados) e não validava se os fornecedores existiam, causando:
1. Cotações criadas não eram salvas
2. Erro ao tentar converter cotação em OS (fornecedores inexistentes)
3. Dados perdidos ao recarregar a página

## Solução Implementada

### 1. Schema Prisma Atualizado

Adicionados os seguintes models ao `prisma/schema.prisma`:

- **Enum `StatusCotacao`**: rascunho, enviada, aceita, perdida, expirada
- **Enum `CategoriaCotacaoItem`**: hospedagem, atividade, transporte, alimentacao
- **Model `Cotacao`**: Tabela principal de cotações
- **Model `CotacaoItem`**: Itens da cotação (hospedagens, atividades, etc)

### 2. Endpoints de API Criados

- **POST `/api/cotacoes`**: Criar nova cotação
- **GET `/api/cotacoes`**: Listar cotações (com filtros)
- **GET `/api/cotacoes/[id]`**: Buscar cotação específica
- **PUT `/api/cotacoes/[id]`**: Atualizar cotação
- **POST `/api/cotacoes/[id]/converter-para-os`**: Converter cotação em OS

### 3. Componentes Atualizados

- `CreateCotacaoDialog`: Agora salva cotações no banco de dados via API

## Passos para Aplicar a Migration

### 1. Gerar e Aplicar Migration

```bash
# Gerar a migration
npx prisma migrate dev --name add_cotacoes_system

# Ou se preferir criar manualmente
npx prisma db push
```

### 2. Regenerar Prisma Client

```bash
npx prisma generate
```

### 3. Verificar Tabelas Criadas

As seguintes tabelas devem ser criadas:
- `cotacoes`
- `cotacao_itens`

### 4. Reiniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

## Estrutura das Tabelas

### Tabela: `cotacoes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único |
| org_id | UUID | Organização |
| titulo | String | Título da cotação |
| cliente_nome | String | Nome do cliente |
| cliente_email | String? | Email do cliente |
| cliente_telefone | String? | Telefone do cliente |
| destino | String | Destino da viagem |
| data_inicio | Date? | Data de início |
| data_fim | Date? | Data de fim |
| status_cotacao | Enum | Status da cotação |
| observacoes_internas | Text? | Observações internas |
| observacoes_cliente | Text? | Observações para o cliente |
| responsavel_id | UUID | Usuário responsável |
| valor_total | Decimal? | Valor total calculado |
| moeda | Enum | Moeda (BRL, USD, EUR) |
| created_at | DateTime | Data de criação |
| updated_at | DateTime | Data de atualização |

### Tabela: `cotacao_itens`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único |
| cotacao_id | UUID | Referência à cotação |
| categoria | Enum | hospedagem, atividade, transporte, alimentacao |
| fornecedor_id | UUID? | Fornecedor vinculado (opcional) |
| tarifa_id | UUID? | Tarifa vinculada (opcional) |
| descricao | String | Descrição do item |
| quantidade | Int | Quantidade |
| valor_unitario | Decimal | Valor unitário |
| moeda | Enum | Moeda |
| subtotal | Decimal | Subtotal calculado |
| observacoes | Text? | Observações |
| created_at | DateTime | Data de criação |
| updated_at | DateTime | Data de atualização |

## Validações Implementadas

### No Backend (API):

1. **Autenticação**: Todas as rotas requerem autenticação
2. **Organização**: Cotações são isoladas por organização
3. **Fornecedores**: Validação de existência ao vincular fornecedor
4. **Cálculos**: Valor total calculado automaticamente

### Conversão para OS:

1. **Fornecedores Obrigatórios**: Hospedagens sem fornecedor geram warning
2. **Validação de Datas**: Datas são validadas antes da conversão
3. **Participante**: Cliente da cotação vira participante da OS
4. **Itens**: Todos os itens são convertidos mantendo vínculos

## Fluxo Atualizado

### Criar Cotação:

```
1. Usuário preenche formulário
   ↓
2. Seleciona fornecedores (opcional)
   ↓
3. Seleciona tarifas (opcional)
   ↓
4. Adiciona itens
   ↓
5. Salva cotação (POST /api/cotacoes)
   ↓
6. Cotação salva no banco de dados
   ↓
7. Pode ser editada/convertida posteriormente
```

### Converter para OS:

```
1. Abre cotação existente
   ↓
2. Clica em "Converter em OS"
   ↓
3. Sistema valida fornecedores
   ↓
4. Cria OS com status "planejamento"
   ↓
5. Cria participante (cliente)
   ↓
6. Cria hospedagens/atividades/transportes
   ↓
7. Redireciona para OS criada
```

## Correções de Bugs

### Bug 1: Fornecedores Inexistentes
**Problema**: Cotação mock não validava se fornecedor existe
**Solução**: API valida existência do fornecedor antes de salvar

### Bug 2: Cotação Diferente da Selecionada
**Problema**: Dados mock não eram persistidos
**Solução**: Cotações agora são salvas no banco e carregadas corretamente

### Bug 3: Perda de Dados
**Problema**: Recarregar página perdia dados da cotação
**Solução**: Dados persistidos no PostgreSQL

## Testes Recomendados

Após aplicar a migration, teste:

1. ✅ Criar nova cotação
2. ✅ Adicionar itens com fornecedores
3. ✅ Adicionar itens sem fornecedores
4. ✅ Salvar cotação
5. ✅ Listar cotações
6. ✅ Abrir cotação específica
7. ✅ Editar cotação
8. ✅ Converter cotação em OS
9. ✅ Verificar warnings de itens sem fornecedor
10. ✅ Verificar OS criada com dados corretos

## Rollback (Se Necessário)

Se precisar reverter a migration:

```bash
# Reverter última migration
npx prisma migrate resolve --rolled-back [migration_name]

# Ou deletar manualmente as tabelas
DROP TABLE IF EXISTS cotacao_itens CASCADE;
DROP TABLE IF EXISTS cotacoes CASCADE;
DROP TYPE IF EXISTS "StatusCotacao";
DROP TYPE IF EXISTS "CategoriaCotacaoItem";
```

## Próximos Passos

Após a migration estar funcionando:

1. Atualizar página de listagem para usar API real
2. Atualizar página de detalhes para usar API real
3. Implementar filtros na listagem
4. Adicionar paginação
5. Implementar busca por texto
6. Adicionar exportação de cotações
7. Implementar envio de cotação por email
