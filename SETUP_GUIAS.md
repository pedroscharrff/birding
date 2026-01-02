# 🚀 Setup Rápido - Sistema de Guias

## ❗ Problema: "Nenhum guia disponível"

Se você está vendo a mensagem **"Nenhum guia disponível"** ao tentar adicionar guias a uma OS, é porque não existem usuários com a role `guia` cadastrados no banco de dados.

---

## ✅ Solução Rápida (Recomendado)

### Execute o script de seed automático:

```bash
npm run db:seed:guias
```

Isso criará **4 guias de exemplo** automaticamente:
- João Silva (joao.guia@birding.com)
- Maria Santos (maria.guia@birding.com)
- Carlos Oliveira (carlos.guia@birding.com)
- Ana Costa (ana.guia@birding.com)

**Senha padrão:** `senha123`

---

## 🔧 Solução Manual (Alternativa)

### 1. Via Prisma Studio

```bash
npm run db:studio
```

1. Acesse a tabela `Usuario`
2. Clique em **"Add record"**
3. Preencha:
   ```
   orgId: [ID da sua organização]
   nome: "Nome do Guia"
   email: "guia@email.com"
   roleGlobal: "guia"  ⚠️ IMPORTANTE!
   hashSenha: [hash bcrypt da senha]
   ativo: true
   ```
4. Salve

### 2. Via SQL Direto

```sql
-- Substitua [ORG_ID] pelo ID da sua organização
-- Substitua [HASH_SENHA] por um hash bcrypt válido

INSERT INTO usuarios (
  id,
  org_id,
  nome,
  email,
  telefone,
  role_global,
  hash_senha,
  ativo,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '[ORG_ID]',
  'João Silva',
  'joao.guia@email.com',
  '+55 11 98765-4321',
  'guia',
  '[HASH_SENHA]',
  true,
  NOW(),
  NOW()
);
```

**Dica:** Para gerar hash bcrypt, use:
```javascript
const bcrypt = require('bcryptjs');
console.log(await bcrypt.hash('senha123', 10));
```

---

## 🔍 Verificar Guias Cadastrados

### Via API de Debug

Acesse no navegador (após fazer login):
```
http://localhost:3000/api/debug/usuarios
```

Você verá:
```json
{
  "success": true,
  "data": {
    "usuarios": [...],
    "stats": {
      "total": 5,
      "porRole": {
        "admin": 1,
        "agente": 2,
        "guia": 2,  // ← Deve ter pelo menos 1
        "motorista": 0,
        "fornecedor": 0,
        "cliente": 0
      }
    }
  }
}
```

### Via Prisma Studio

```bash
npm run db:studio
```

Filtrar tabela `Usuario` por `roleGlobal = "guia"`

---

## 🎯 Checklist de Verificação

Antes de adicionar guias a uma OS, verifique:

- [ ] Existe pelo menos 1 usuário com `roleGlobal = "guia"`
- [ ] O guia está `ativo = true`
- [ ] O guia pertence à mesma organização (`orgId`)
- [ ] O guia **NÃO** está já designado na OS atual

---

## 📋 Estrutura do Usuário Guia

```typescript
{
  id: string                    // UUID gerado automaticamente
  orgId: string                 // ID da organização
  nome: string                  // Nome completo do guia
  email: string                 // Email único
  telefone?: string             // Telefone (opcional)
  roleGlobal: "guia"            // ⚠️ OBRIGATÓRIO SER "guia"
  hashSenha: string             // Hash bcrypt da senha
  ativo: boolean                // true para aparecer nas listas
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## 🔄 Após Cadastrar Guias

1. Recarregue a página da OS
2. Clique em **Aba "Guias"**
3. Clique em **"Adicionar Guia"**
4. Os guias agora devem aparecer no seletor! ✅

---

## ❓ FAQ

### P: Por que preciso de usuários com role "guia"?
**R:** O sistema de designação de guias usa usuários internos (funcionários/colaboradores). Para guias externos/freelancers, use o sistema de **Fornecedores tipo "Guiamento"**.

### P: Qual a diferença entre "Guias (Designação)" e "Guias (Fornecedores)"?
**R:**
- **Designação:** Guias internos da empresa (sem custo na OS)
- **Fornecedores:** Guias externos com tarifas e custos

Veja [GUIAS_DOCUMENTATION.md](./GUIAS_DOCUMENTATION.md) para detalhes completos.

### P: Posso ter o mesmo guia como usuário E fornecedor?
**R:** Sim! São sistemas independentes. Use designação para controle de equipe e fornecedor para controle financeiro.

---

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do servidor Next.js
3. Confirme que a API `/api/usuarios/guias` retorna dados

---

**Última atualização:** 01/11/2025
