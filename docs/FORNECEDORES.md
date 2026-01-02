# Módulo de Fornecedores

## Visão Geral

O módulo de fornecedores permite gerenciar toda a rede de parceiros e prestadores de serviços da operadora de turismo. Com uma interface moderna e intuitiva, facilita o cadastro, busca e organização de fornecedores por categoria.

## Funcionalidades

### 1. Listagem de Fornecedores

- **Visualização em Grid ou Lista**: Alterne entre visualização em cards (grid) ou lista detalhada
- **Busca Inteligente**: Pesquise por nome fantasia, razão social, email, telefone ou documento
- **Filtros por Tipo**: Filtre rapidamente por categoria de fornecedor
- **Estatísticas em Tempo Real**: Visualize totais por categoria

### 2. Categorias de Fornecedores

- **Hotelaria**: Hotéis, pousadas, resorts
- **Guiamento**: Guias turísticos e serviços de guiamento
- **Transporte**: Empresas de transporte, locadoras, motoristas
- **Alimentação**: Restaurantes, cafés, serviços de catering
- **Atividade**: Operadoras de atividades específicas
- **Outros**: Demais prestadores de serviços

### 3. Cadastro Completo

#### Informações Básicas
- Nome Fantasia (obrigatório)
- Razão Social
- Tipo de Fornecedor (obrigatório)
- CPF/CNPJ

#### Contato
- E-mail
- Telefone

#### Endereço Completo
- Logradouro
- Número
- Complemento
- Bairro
- Cidade
- Estado
- CEP

#### Observações
- Campo livre para anotações adicionais

### 4. Operações CRUD

- **Criar**: Adicione novos fornecedores com formulário completo
- **Visualizar**: Veja todos os detalhes em cards ou lista
- **Editar**: Atualize informações de fornecedores existentes
- **Excluir**: Remova fornecedores (com validação de dependências)

## Interface do Usuário

### Cards de Estatísticas

Na parte superior da página, cards interativos mostram:
- Total geral de fornecedores
- Total por categoria (clicável para filtrar)

### Barra de Busca e Filtros

- Campo de busca com ícone e botão de limpar
- Botões para alternar entre visualização grid/lista
- Badge mostrando filtro ativo (removível)

### Visualização Grid

Cards compactos mostrando:
- Nome fantasia e razão social
- Badge colorido com tipo
- Ícones com informações de contato
- Botões de ação (aparecem ao hover)

### Visualização Lista

Linhas expandidas mostrando:
- Ícone colorido do tipo
- Todas as informações em grid responsivo
- Botões de ação sempre visíveis

## API Endpoints

### GET /api/fornecedores
Lista todos os fornecedores da organização

**Query Parameters:**
- `tipo`: Filtrar por tipo de fornecedor
- `search`: Busca por nome ou razão social

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nomeFantasia": "Hotel Paradise",
      "razaoSocial": "Paradise Hotéis Ltda",
      "tipo": "hotelaria",
      "email": "contato@paradise.com",
      "telefone": "(11) 99999-9999",
      "documento": "12.345.678/0001-90",
      "endereco": {
        "cidade": "São Paulo",
        "estado": "SP"
      },
      "obs": "Fornecedor premium",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/fornecedores
Cria um novo fornecedor

**Body:**
```json
{
  "nomeFantasia": "Hotel Paradise",
  "razaoSocial": "Paradise Hotéis Ltda",
  "tipo": "hotelaria",
  "email": "contato@paradise.com",
  "telefone": "(11) 99999-9999",
  "documento": "12.345.678/0001-90",
  "endereco": {
    "logradouro": "Av. Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  },
  "obs": "Fornecedor premium"
}
```

### GET /api/fornecedores/[id]
Busca um fornecedor específico

### PATCH /api/fornecedores/[id]
Atualiza um fornecedor existente

**Body:** Mesma estrutura do POST (todos os campos opcionais)

### DELETE /api/fornecedores/[id]
Remove um fornecedor

**Validações:**
- Verifica se há vínculos com OS, atividades, hospedagens ou transportes
- Retorna erro se houver dependências

## Estrutura de Arquivos

```
app/
  (dashboard)/
    dashboard/
      fornecedores/
        page.tsx                 # Página principal
  api/
    fornecedores/
      route.ts                   # GET (list) e POST (create)
      [id]/
        route.ts                 # GET, PATCH e DELETE

components/
  forms/
    FornecedorFormDialog.tsx     # Formulário em dialog

lib/
  validators/
    fornecedor.ts                # Schemas Zod para validação

prisma/
  schema.prisma                  # Model Fornecedor
```

## Validações

### Campos Obrigatórios
- Nome Fantasia
- Tipo de Fornecedor

### Validações de Formato
- E-mail: Validação de formato válido
- Estado: Máximo 2 caracteres
- CEP: Formato brasileiro

### Validações de Negócio
- Não permite exclusão se houver vínculos com:
  - Ordens de Serviço (OSFornecedor)
  - Atividades
  - Hospedagens
  - Transportes

## Integração com Outros Módulos

### Ordens de Serviço
Fornecedores podem ser vinculados a OS através da tabela `OSFornecedor`

### Atividades
Atividades podem referenciar um fornecedor específico

### Hospedagens
Hospedagens são sempre vinculadas a um fornecedor de hotelaria

### Transportes
Transportes podem ter fornecedor associado

### Financeiro
Lançamentos financeiros podem referenciar fornecedores

## Melhorias Futuras

- [ ] Importação em lote via CSV/Excel
- [ ] Exportação de lista de fornecedores
- [ ] Histórico de transações por fornecedor
- [ ] Avaliação e rating de fornecedores
- [ ] Documentos anexos (contratos, certificados)
- [ ] Integração com API de consulta de CNPJ
- [ ] Dashboard de performance de fornecedores
- [ ] Sistema de favoritos
- [ ] Tags personalizadas
- [ ] Múltiplos contatos por fornecedor

## Tecnologias Utilizadas

- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Prisma**: ORM para banco de dados
- **Tailwind CSS**: Estilização
- **Radix UI**: Componentes acessíveis
- **Lucide React**: Ícones
- **Zod**: Validação de schemas

## Acessibilidade

- Navegação por teclado completa
- Labels semânticos em todos os campos
- Feedback visual para estados de hover/focus
- Mensagens de erro descritivas
- Componentes Radix UI com suporte a screen readers

## Performance

- Busca client-side para resposta instantânea
- Memoização de listas filtradas
- Lazy loading de diálogos
- Otimização de re-renders com useMemo/useCallback
