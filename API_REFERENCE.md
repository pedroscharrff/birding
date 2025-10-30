# API Reference - OS/Tour

Documentação completa das rotas API REST do sistema.

## 🔐 Autenticação

Todas as rotas protegidas requerem cookie de autenticação HTTP-only.

### POST /api/auth/login

Autenticar usuário e obter tokens.

**Body**:
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "uuid",
      "nome": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "roleGlobal": "agente",
      "organizacao": "Nome da Organização"
    }
  },
  "message": "Login realizado com sucesso"
}
```

**Response 401**:
```json
{
  "success": false,
  "error": "Email ou senha inválidos"
}
```

**Cookies Definidos**:
- `access_token`: JWT válido por 15 minutos
- `refresh_token`: JWT válido por 7 dias

---

### POST /api/auth/logout

Fazer logout e limpar cookies.

**Response 200**:
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

### GET /api/auth/me

Obter dados do usuário autenticado.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "telefone": "+55 11 99999-9999",
    "roleGlobal": "agente",
    "ativo": true,
    "organizacao": {
      "id": "uuid",
      "nome": "Nome da Organização"
    }
  }
}
```

**Response 401**:
```json
{
  "success": false,
  "error": "Não autenticado"
}
```

---

## 📋 Ordens de Serviço (OS)

### GET /api/os

Listar OS com filtros e paginação.

**Query Params**:
- `status` (string, opcional): Filtrar por status
- `agente` (uuid, opcional): Filtrar por agente responsável
- `destino` (string, opcional): Filtrar por destino (case-insensitive)
- `dataInicio` (date, opcional): Data de início >= valor
- `dataFim` (date, opcional): Data de fim <= valor
- `page` (number, default: 1): Página atual
- `limit` (number, default: 20): Itens por página

**Exemplo**:
```
GET /api/os?status=planejamento&page=1&limit=10
```

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "titulo": "Tour Pantanal Sul",
      "destino": "Corumbá, MS",
      "dataInicio": "2025-01-15",
      "dataFim": "2025-01-20",
      "status": "planejamento",
      "agenteResponsavel": {
        "id": "uuid",
        "nome": "João Silva",
        "email": "joao@exemplo.com"
      },
      "_count": {
        "participantes": 8,
        "atividades": 3,
        "hospedagens": 2
      }
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### POST /api/os

Criar nova OS.

**Body**:
```json
{
  "titulo": "Tour Pantanal Sul",
  "destino": "Corumbá, MS",
  "dataInicio": "2025-01-15",
  "dataFim": "2025-01-20",
  "status": "planejamento",
  "agenteResponsavelId": "uuid",
  "descricao": "Descrição opcional",
  "checklist": {
    "passagens": false,
    "hotel": false
  }
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "titulo": "Tour Pantanal Sul",
    "destino": "Corumbá, MS",
    "dataInicio": "2025-01-15",
    "dataFim": "2025-01-20",
    "status": "planejamento",
    "agenteResponsavel": {
      "id": "uuid",
      "nome": "João Silva"
    }
  },
  "message": "OS criada com sucesso"
}
```

**Response 400** (Validação):
```json
{
  "success": false,
  "error": "Dados inválidos",
  "details": [
    {
      "path": ["titulo"],
      "message": "Título deve ter no mínimo 3 caracteres"
    }
  ]
}
```

---

### GET /api/os/[id]

Obter OS por ID com todos os relacionamentos.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "titulo": "Tour Pantanal Sul",
    "destino": "Corumbá, MS",
    "dataInicio": "2025-01-15",
    "dataFim": "2025-01-20",
    "status": "planejamento",
    "descricao": "...",
    "checklist": {},
    "agenteResponsavel": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@exemplo.com"
    },
    "participantes": [
      {
        "id": "uuid",
        "nome": "Maria Santos",
        "email": "maria@exemplo.com",
        "telefone": "+55 11 99999-9999"
      }
    ],
    "fornecedores": [],
    "atividades": [],
    "hospedagens": [],
    "transportes": [],
    "passagensAereas": [],
    "guiasDesignacao": [],
    "motoristasDesignacao": [],
    "scoutings": [],
    "anotacoes": [],
    "historicoStatus": []
  }
}
```

**Response 404**:
```json
{
  "success": false,
  "error": "OS não encontrada"
}
```

---

### PATCH /api/os/[id]

Atualizar OS (campos opcionais).

**Body**:
```json
{
  "titulo": "Novo Título",
  "status": "cotacoes",
  "descricao": "Nova descrição"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "titulo": "Novo Título",
    "status": "cotacoes"
  },
  "message": "OS atualizada com sucesso"
}
```

---

### DELETE /api/os/[id]

Deletar OS (cascade para relacionamentos).

**Response 200**:
```json
{
  "success": true,
  "message": "OS deletada com sucesso"
}
```

---

### POST /api/os/[id]/participantes

Adicionar participante à OS.

**Body**:
```json
{
  "nome": "Maria Santos",
  "email": "maria@exemplo.com",
  "telefone": "+55 11 99999-9999",
  "passaporteNumero": "BR123456",
  "passaporteValidade": "2030-12-31",
  "alergias": "Lactose",
  "restricoes": "Vegetariano",
  "idade": 35,
  "observacoes": "Observações gerais"
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "Maria Santos",
    "email": "maria@exemplo.com"
  },
  "message": "Participante adicionado com sucesso"
}
```

---

## 💰 Financeiro

### GET /api/financeiro/lancamentos

Listar lançamentos financeiros com filtros.

**Query Params**:
- `osId` (uuid, opcional): Filtrar por OS
- `categoria` (string, opcional): Filtrar por categoria
- `tipo` (string, opcional): Filtrar por tipo
- `dataInicio` (date, opcional): Data >= valor
- `dataFim` (date, opcional): Data <= valor
- `page` (number, default: 1)
- `limit` (number, default: 50)

**Exemplo**:
```
GET /api/financeiro/lancamentos?osId=uuid&categoria=hospedagem
```

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tipo": "saida",
      "categoria": "hospedagem",
      "valor": 1500.00,
      "moeda": "BRL",
      "data": "2025-01-15",
      "observacao": "Hotel Zagaia - 3 diárias",
      "os": {
        "id": "uuid",
        "titulo": "Tour Pantanal"
      },
      "fornecedor": {
        "id": "uuid",
        "nomeFantasia": "Hotel Zagaia"
      },
      "criador": {
        "id": "uuid",
        "nome": "João Silva"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

---

### POST /api/financeiro/lancamentos

Criar lançamento financeiro.

**Body**:
```json
{
  "osId": "uuid",
  "fornecedorId": "uuid",
  "tipo": "saida",
  "categoria": "hospedagem",
  "valor": 1500.00,
  "moeda": "BRL",
  "data": "2025-01-15",
  "observacao": "Hotel Zagaia - 3 diárias",
  "comprovanteUrl": "https://exemplo.com/comprovante.pdf"
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tipo": "saida",
    "categoria": "hospedagem",
    "valor": 1500.00,
    "moeda": "BRL",
    "data": "2025-01-15"
  },
  "message": "Lançamento criado com sucesso"
}
```

---

## 📊 Tipos e Enums

### StatusOS
```typescript
type StatusOS =
  | "planejamento"
  | "cotacoes"
  | "reservas_pendentes"
  | "reservas_confirmadas"
  | "documentacao"
  | "pronto_para_viagem"
  | "em_andamento"
  | "concluida"
  | "pos_viagem"
  | "cancelada"
```

### RoleGlobal
```typescript
type RoleGlobal =
  | "admin"
  | "agente"
  | "guia"
  | "motorista"
  | "fornecedor"
  | "cliente"
```

### TipoLancamento
```typescript
type TipoLancamento =
  | "entrada"
  | "saida"
  | "adiantamento"
  | "ajuste"
```

### CategoriaLancamento
```typescript
type CategoriaLancamento =
  | "hospedagem"
  | "guiamento"
  | "transporte"
  | "alimentacao"
  | "atividade"
  | "taxa"
  | "passagem_aerea"
  | "despesa_guia"
  | "despesa_motorista"
  | "outros"
```

### Moeda
```typescript
type Moeda = "BRL" | "USD" | "EUR"
```

---

## 🔒 Códigos de Status HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro interno |

---

## 📝 Notas

### Paginação

Todas as rotas de listagem suportam paginação:

```json
{
  "pagination": {
    "total": 100,      // Total de itens
    "page": 1,         // Página atual
    "limit": 20,       // Itens por página
    "totalPages": 5    // Total de páginas
  }
}
```

### Validação

Erros de validação retornam detalhes:

```json
{
  "success": false,
  "error": "Dados inválidos",
  "details": [
    {
      "path": ["campo"],
      "message": "Mensagem de erro"
    }
  ]
}
```

### Datas

Todas as datas são no formato ISO 8601: `YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ss.sssZ`

---

## 🚧 Rotas Pendentes (Próximas Versões)

- `GET /api/fornecedores`
- `POST /api/fornecedores`
- `GET /api/usuarios`
- `GET /api/calendario`
- `POST /api/calendario`
- `GET /api/os/[id]/hospedagens`
- `GET /api/os/[id]/atividades`
- `GET /api/os/[id]/transportes`

---

**Versão**: 1.0.0  
**Última atualização**: 2025-01-14
