# Transferência de Responsável de Tours

## Visão Geral

Implementação da funcionalidade de transferência de responsável de tours (OS) entre agentes, permitindo que tours sejam reatribuídos após a criação.

## Componentes Implementados

### 1. Endpoint API - `/api/os/[id]/transfer`

**Arquivo:** `app/api/os/[id]/transfer/route.ts`

**Método:** `POST`

**Funcionalidades:**
- Valida se a OS existe e pertence à organização
- Verifica se o novo agente é válido (ativo e com role admin/agente)
- Previne transferência para o mesmo agente atual
- Atualiza o campo `agenteResponsavelId` da OS
- Registra a transferência na auditoria
- Cria anotação automática sobre a transferência
- Invalida cache de estatísticas

**Payload:**
```json
{
  "novoAgenteResponsavelId": "uuid-do-agente"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": { /* OS atualizada */ },
  "message": "Tour transferido com sucesso para [Nome do Agente]"
}
```

### 2. Componente de Diálogo - `TransferResponsavelDialog`

**Arquivo:** `components/os/TransferResponsavelDialog.tsx`

**Funcionalidades:**
- Carrega lista de agentes disponíveis (admin e agente ativos)
- Filtra o agente atual da lista
- Exibe informações do agente atual
- Permite seleção do novo responsável
- Mostra confirmação antes da transferência
- Feedback visual durante o processo

**Props:**
```typescript
{
  osId: string
  agenteAtual: { id: string, nome: string, email: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}
```

### 3. Integração na UI - `OSInfoSection`

**Arquivo:** `components/os/OSInfoSection.tsx`

**Modificações:**
- Adicionado botão "Transferir" na seção do agente responsável
- Integrado componente `TransferResponsavelDialog`
- Atualiza dados da OS após transferência bem-sucedida

### 4. Atualização do Endpoint de Usuários

**Arquivo:** `app/api/usuarios/route.ts`

**Melhorias:**
- Suporte para filtro por múltiplos roles via query param `roles` (separados por vírgula)
- Retorno padronizado com formato `{ success: true, data: [...] }`
- Exemplo de uso: `/api/usuarios?roles=admin,agente&ativo=true`

## Fluxo de Transferência

1. **Usuário acessa a OS** → Visualiza informações do agente responsável atual
2. **Clica em "Transferir"** → Abre diálogo de transferência
3. **Sistema carrega agentes** → Lista todos os agentes ativos (exceto o atual)
4. **Usuário seleciona novo agente** → Visualiza confirmação
5. **Confirma transferência** → Sistema executa:
   - Atualiza `agenteResponsavelId` na OS
   - Registra na auditoria (dados antigos e novos)
   - Cria anotação automática
   - Invalida cache
6. **Feedback de sucesso** → OS é atualizada na interface

## Auditoria e Rastreamento

Cada transferência gera:

### Registro de Auditoria
- **Ação:** `atualizar`
- **Entidade:** `os`
- **Campos alterados:** `['agenteResponsavelId']`
- **Dados antigos:** ID e nome do agente anterior
- **Dados novos:** ID e nome do novo agente
- **Descrição:** "Responsável transferido de [Nome Anterior] para [Nome Novo]"

### Anotação Automática
- Texto: "🔄 Tour transferido de [Nome Anterior] para [Nome Novo]"
- Autor: Usuário que realizou a transferência
- Timestamp automático

## Validações Implementadas

1. **OS existe e pertence à organização**
2. **Novo agente existe e está ativo**
3. **Novo agente tem role adequado** (admin ou agente)
4. **Novo agente é diferente do atual**
5. **Usuário está autenticado**

## Segurança

- Autenticação obrigatória via `requireAuth()`
- Validação de organização (orgId)
- Validação de roles permitidos
- Schema de validação com Zod
- Logs de auditoria completos

## Interface do Usuário

### Botão de Transferência
- Localização: Seção "Agente Responsável" na página de detalhes da OS
- Ícone: UserCog
- Texto: "Transferir"
- Estilo: Outline, tamanho pequeno

### Diálogo de Transferência
- **Cabeçalho:** Título e descrição clara
- **Agente Atual:** Card com informações (nome e email)
- **Seleção:** Dropdown com lista de agentes disponíveis
- **Confirmação:** Mensagem de atenção antes da ação
- **Estados:** Loading durante busca e transferência
- **Feedback:** Toast de sucesso/erro

## Casos de Uso

1. **Redistribuição de carga de trabalho**
   - Transferir tours de um agente sobrecarregado para outro

2. **Mudança de responsabilidade**
   - Reatribuir tour quando agente sai de férias ou licença

3. **Especialização**
   - Transferir para agente especializado em determinado destino

4. **Cobertura de ausência**
   - Reatribuir temporariamente durante ausências

## Melhorias Futuras (Sugestões)

1. **Notificações**
   - Notificar agente anterior e novo agente sobre a transferência
   - Email automático com detalhes da OS

2. **Histórico de transferências**
   - Visualização dedicada de todas as transferências de uma OS
   - Linha do tempo de responsáveis

3. **Transferência em lote**
   - Permitir transferir múltiplas OS de uma vez
   - Útil para redistribuição massiva

4. **Motivo da transferência**
   - Campo opcional para justificar a transferência
   - Registrado na auditoria

5. **Permissões granulares**
   - Controlar quem pode transferir tours
   - Restrições baseadas em hierarquia

## Testes Recomendados

1. **Teste básico de transferência**
   - Criar OS com agente A
   - Transferir para agente B
   - Verificar atualização

2. **Validações**
   - Tentar transferir para agente inativo
   - Tentar transferir para mesmo agente
   - Tentar transferir OS inexistente

3. **Auditoria**
   - Verificar registro na tabela de auditoria
   - Verificar anotação automática criada

4. **UI/UX**
   - Testar loading states
   - Testar mensagens de erro
   - Testar atualização após sucesso

5. **Permissões**
   - Testar com diferentes roles
   - Testar acesso entre organizações

## Arquivos Modificados/Criados

### Criados
- `app/api/os/[id]/transfer/route.ts`
- `components/os/TransferResponsavelDialog.tsx`
- `docs/TRANSFERENCIA_RESPONSAVEL.md`

### Modificados
- `app/api/usuarios/route.ts`
- `components/os/OSInfoSection.tsx`
