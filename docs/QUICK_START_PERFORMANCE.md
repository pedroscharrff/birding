# Guia Rápido - Otimizações de Performance

## 🚀 Aplicar as Otimizações

### 1. Executar Migration

```bash
# Produção
npx prisma migrate deploy

# Desenvolvimento
npx prisma migrate dev --name performance_optimization
```

### 2. Atualizar Cliente Prisma

```bash
npx prisma generate
```

### 3. Inicializar Materialized Views

```bash
# No console do PostgreSQL ou via Prisma Studio
SELECT refresh_dashboard_stats();
```

---

## 📊 Usar as Otimizações

### Dashboard com Estatísticas Rápidas

```typescript
import { getDashboardStats } from '@/lib/services/dashboard-stats'

// No componente ou API
const stats = await getDashboardStats(session.orgId)

console.log(stats)
// {
//   totalOS: 150,
//   osEmAndamento: 12,
//   osProximaSemana: 5,
//   totalParticipantes: 847,
//   ...
// }
```

### Estatísticas de OS Individual

```typescript
import { getOSStats } from '@/lib/services/dashboard-stats'

const stats = await getOSStats(osId)

console.log(stats)
// {
//   totalParticipantes: 15,
//   totalAtividades: 8,
//   totalReceitas: 50000,
//   totalDespesas: 32000,
//   saldo: 18000,
//   ...
// }
```

### Usar no Dashboard (página)

```typescript
// app/(dashboard)/dashboard/page.tsx
"use client"

import { useEffect, useState } from 'react'
import { DashboardStats } from '@/lib/services/dashboard-stats'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data.data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardTitle>Total OS</CardTitle>
          <CardValue>{stats?.totalOS}</CardValue>
        </Card>
        <Card>
          <CardTitle>Em Andamento</CardTitle>
          <CardValue>{stats?.osEmAndamento}</CardValue>
        </Card>
        {/* ... mais cards */}
      </div>
    </div>
  )
}
```

---

## ⚙️ Iniciar Scheduler

### No arquivo de inicialização da app

```typescript
// app/layout.tsx ou lib/startup.ts
import { startScheduler } from '@/lib/services/refresh-scheduler'

// Iniciar scheduler quando a aplicação subir
if (typeof window === 'undefined') {
  // Apenas no servidor
  startScheduler({
    enableSmartScheduling: true,
    onSuccess: () => console.log('[App] Stats atualizadas'),
    onError: (error) => console.error('[App] Erro no scheduler:', error)
  })
}
```

### Verificar Status

```typescript
import { getSchedulerStatus } from '@/lib/services/refresh-scheduler'

const status = getSchedulerStatus()
console.log('Scheduler:', status)
// {
//   isRunning: true,
//   lastRefresh: 2025-01-31T10:30:00.000Z,
//   nextRefresh: 2025-01-31T10:35:00.000Z,
//   consecutiveErrors: 0,
//   currentInterval: 300000
// }
```

---

## 🔄 Forçar Refresh (Admin)

### Via API

```bash
curl -X POST https://seu-app.com/api/dashboard/stats/refresh \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### Via Código

```typescript
import { refreshMaterializedViews } from '@/lib/services/dashboard-stats'

// Executar refresh manual (requer permissões)
await refreshMaterializedViews()
```

---

## 🎯 Boas Práticas

### ✅ FAÇA

1. **Use selects específicos**:
   ```typescript
   const users = await prisma.usuario.findMany({
     select: {
       id: true,
       nome: true,
       email: true
     }
   })
   ```

2. **Invalide cache após mudanças**:
   ```typescript
   // Após criar/atualizar OS
   import { invalidateOSStatsCache } from '@/lib/services/dashboard-stats'

   await prisma.oS.update({ ... })
   invalidateOSStatsCache(osId)
   ```

3. **Use paginação**:
   ```typescript
   const os = await prisma.oS.findMany({
     skip: (page - 1) * limit,
     take: limit
   })
   ```

### ❌ NÃO FAÇA

1. **Não use include sem necessidade**:
   ```typescript
   // ❌ Evitar
   const os = await prisma.oS.findMany({
     include: {
       participantes: true,
       atividades: true,
       hospedagens: true,
       // carrega muitos dados desnecessários
     }
   })
   ```

2. **Não busque tudo sem limit**:
   ```typescript
   // ❌ Evitar
   const allOS = await prisma.oS.findMany()
   ```

3. **Não force refresh com muita frequência**:
   ```typescript
   // ❌ Evitar (sobrecarrega o banco)
   setInterval(() => refreshMaterializedViews(), 10000) // a cada 10s
   ```

---

## 📈 Verificar Performance

### Ver tamanho das views

```sql
SELECT
  matviewname,
  pg_size_pretty(pg_total_relation_size('public.' || matviewname)) as size
FROM pg_matviews
WHERE schemaname = 'public';
```

### Ver uso dos índices

```sql
SELECT
  tablename,
  indexname,
  idx_scan as "Vezes usado"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

### Ver queries mais lentas

```sql
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🆘 Troubleshooting Rápido

### Problema: Dashboard lento

**Solução**:
```typescript
// Forçar refresh das views
await refreshMaterializedViews()
```

### Problema: Dados desatualizados

**Solução**:
```typescript
// Limpar cache e forçar refresh
cache.clear()
await refreshMaterializedViews()
```

### Problema: Scheduler não está rodando

**Solução**:
```typescript
import { stopScheduler, startScheduler } from '@/lib/services/refresh-scheduler'

stopScheduler()
startScheduler()
```

### Problema: Muitos erros no scheduler

**Solução**:
```sql
-- Verificar se views existem
SELECT matviewname FROM pg_matviews WHERE schemaname = 'public';

-- Se não existirem, recriar
SELECT refresh_dashboard_stats();
```

---

## 📝 Checklist de Deploy

- [ ] Executar migration de performance
- [ ] Gerar cliente Prisma
- [ ] Fazer backup do banco antes da migration
- [ ] Inicializar materialized views (primeiro refresh)
- [ ] Iniciar scheduler na aplicação
- [ ] Verificar logs para confirmar funcionamento
- [ ] Monitorar performance nas primeiras horas
- [ ] Ajustar intervalos do scheduler se necessário

---

## 🎓 Mais Informações

Ver documentação completa em: [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)
