# 🔍 Troubleshooting - Alertas de Guias

## ❗ Problema: Alertas não desaparecem após adicionar guias

Se você adicionou guias a uma OS mas o alerta "OS sem guia" continua aparecendo, siga este guia passo a passo.

---

## 🎯 Diagnóstico Rápido

### Passo 1: Debug Endpoint

Acesse no navegador (após fazer login):
```
http://localhost:3000/api/debug/alertas-guias
```

Isso mostrará:
- ✅ Lista completa de OS ativas
- ✅ Quantos guias internos cada OS tem
- ✅ Quantos fornecedores tipo "guiamento" cada OS tem
- ✅ Se deve ou não gerar alerta (e por quê)

**Exemplo de saída:**
```json
{
  "resumo": {
    "totalOS": 5,
    "osComGuias": 3,
    "osSemGuias": 2,
    "osComAlerta": 2
  },
  "detalhes": [
    {
      "titulo": "Tour Pantanal",
      "diasAteInicio": 10,
      "guiasInternos": { "total": 1, "lista": [...] },
      "fornecedores": { "guiamento": [...] },
      "totalGuias": { "internos": 1, "externos": 0, "total": 1 },
      "alerta": {
        "deveGerar": false,  // ✅ NÃO vai gerar alerta
        "motivo": "Tem guia designado"
      }
    }
  ]
}
```

### Passo 2: Verificar Cache

```
GET http://localhost:3000/api/debug/cache
```

Se o cache estiver ativo, force a invalidação:

```
POST http://localhost:3000/api/debug/cache
```

### Passo 3: Verificar Banco de Dados

Execute o script SQL em [scripts/debug-guias.sql](scripts/debug-guias.sql) no Prisma Studio:

```bash
npm run db:studio
```

Cole o SQL na aba "Raw Query" para ver exatamente o que está no banco.

---

## 🔧 Soluções Possíveis

### Solução 1: Limpeza de Cache ✅

**O que fazer:**
```bash
# Via API
curl -X POST http://localhost:3000/api/debug/cache

# OU reinicie o servidor
npm run dev
```

**Por que funciona:**
Cache de alertas tem TTL de 5 minutos. Se você adicionou guias, pode estar vendo dados em cache.

---

### Solução 2: Verificar Tipo de Fornecedor ⚠️

**Problema:**
Você adicionou um fornecedor à OS, mas o tipo NÃO é "guiamento".

**Verificação:**
```sql
SELECT
  o.titulo,
  f.nome_fantasia,
  f.tipo,  -- Deve ser 'guiamento'
  osf.categoria  -- Deve ser 'guiamento'
FROM os_fornecedores osf
JOIN fornecedores f ON f.id = osf.fornecedor_id
JOIN os o ON o.id = osf.os_id
WHERE o.id = 'SUA_OS_ID';
```

**Como corrigir:**
1. Vá em Dashboard → Fornecedores
2. Edite o fornecedor
3. Mude o tipo para "Guiamento"
4. Limpe o cache

---

### Solução 3: Verificar Prazo ⏰

**Critério do Alerta:**
```
diasAteInicio <= 15 E diasAteInicio > 0 E totalGuias = 0
```

**Verificação:**
Se a OS inicia em mais de 15 dias, o alerta NÃO deve aparecer (ainda).
Se a OS já passou, o alerta NÃO deve aparecer (já era).

**Ver quantos dias faltam:**
```sql
SELECT
  titulo,
  data_inicio,
  EXTRACT(DAY FROM (data_inicio - CURRENT_DATE)) AS dias_ate_inicio
FROM os
WHERE id = 'SUA_OS_ID';
```

---

### Solução 4: Reiniciar Servidor 🔄

Às vezes o hot reload do Next.js não pega mudanças em services:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

---

## 🧪 Teste Completo Passo a Passo

### 1. Criar Situação de Teste

```sql
-- Criar OS sem guia que deve gerar alerta
INSERT INTO os (id, org_id, titulo, destino, data_inicio, data_fim, status, agente_responsavel_id)
VALUES (
  gen_random_uuid(),
  'YOUR_ORG_ID',
  'Teste Alerta Guia',
  'Pantanal',
  CURRENT_DATE + INTERVAL '10 days',  -- 10 dias no futuro
  CURRENT_DATE + INTERVAL '15 days',
  'planejamento',
  'YOUR_USER_ID'
);
```

### 2. Verificar Alerta Aparece

```
GET http://localhost:3000/api/alerts?orgId=YOUR_ORG_ID
```

Deve conter:
```json
{
  "alerts": [
    {
      "id": "os-...-sem-guia",
      "severity": "warning",
      "description": "A OS \"Teste Alerta Guia\" inicia em 10 dias e ainda não tem guia..."
    }
  ]
}
```

### 3. Adicionar Guia Interno

Via interface:
1. Abra a OS
2. Aba "Guias"
3. Adicionar guia

Ou via SQL:
```sql
INSERT INTO os_guias_designacao (id, os_id, guia_id)
VALUES (gen_random_uuid(), 'OS_ID', 'GUIA_ID');
```

### 4. Limpar Cache

```
POST http://localhost:3000/api/debug/cache
```

### 5. Verificar Alerta Sumiu

```
GET http://localhost:3000/api/alerts?orgId=YOUR_ORG_ID
```

O alerta "sem-guia" NÃO deve mais aparecer! ✅

---

## 📊 Logs de Debug

Os logs do servidor mostram:

```
[API] Buscando guias para orgId: xxx
[API] Guias encontrados: 2
[Cache] Cache de alertas invalidado após adicionar guia
```

Verifique o console do terminal onde `npm run dev` está rodando.

---

## 🐛 Casos Especiais

### Caso 1: Guia foi removido mas alerta não aparece

**Solução:**
A remoção também invalida o cache automaticamente. Aguarde 2-3 segundos e recarregue.

### Caso 2: Fornecedor está marcado como "outros" em vez de "guiamento"

**Solução:**
1. Edite o fornecedor
2. Mude `tipo` para `guiamento`
3. Ao adicionar à OS, escolha categoria `guiamento`

### Caso 3: OS em status "concluída" mostra alerta

**Impossível:**
OS concluídas são filtradas na query (linha 24-26 de alerts.ts):
```typescript
status: {
  notIn: ['concluida', 'pos_viagem', 'cancelada'],
}
```

---

## 🎯 Checklist Final

Antes de reportar um bug, confirme:

- [ ] Executou `POST /api/debug/cache` para limpar cache
- [ ] Aguardou 5 segundos e recarregou a página
- [ ] Verificou em `/api/debug/alertas-guias` que o guia está sendo detectado
- [ ] Confirmou que fornecedor tem tipo/categoria "guiamento"
- [ ] Verificou que OS inicia entre 1-15 dias no futuro
- [ ] Reiniciou o servidor de desenvolvimento

---

## 📞 Última Solução: Reset Completo

Se nada funcionar:

```bash
# 1. Pare o servidor
Ctrl+C

# 2. Limpe cache do Next.js
rm -rf .next

# 3. Reinstale dependências
npm install

# 4. Regenere Prisma
npm run db:generate

# 5. Reinicie
npm run dev

# 6. Force reload no navegador
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# 7. Limpe cache via API
POST http://localhost:3000/api/debug/cache
```

---

## 📝 Arquivos de Debug Criados

1. **API Debug Detalhado:** [/api/debug/alertas-guias](app/api/debug/alertas-guias/route.ts)
2. **Cache Management:** [/api/debug/cache](app/api/debug/cache/route.ts)
3. **SQL Queries:** [scripts/debug-guias.sql](scripts/debug-guias.sql)

---

**Última atualização:** 01/11/2025
