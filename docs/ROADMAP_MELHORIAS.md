# 📈 Roadmap de Melhorias (Execução por Etapas)

Documento consolidado com todas as melhorias sugeridas, organizado em etapas independentes com passos claros, dependências, APIs envolvidas e critérios de aceite. Use como checklist de execução incremental.

---

## Sumário
- [Fase 1 (Entregue)](#fase-1-entregue)
- [Fase 2 - UI e Fluxos](#fase-2---ui-e-fluxos)
- [Fase 3 - Observabilidade e Qualidade](#fase-3---observabilidade-e-qualidade)
- [Fase 4 - Performance e Escalabilidade](#fase-4---performance-e-escalabilidade)
- [Fase 5 - Segurança e Governança](#fase-5---segurança-e-governança)
- [Apêndice A - APIs](#apêndice-a---apis)
- [Apêndice B - Modelos de Dados](#apêndice-b---modelos-de-dados)

---

## Fase 1 (Entregue)
- ✅ Tipos e serviços de Alertas
- ✅ API `/api/alerts`
- ✅ Validações de status com checklists
- ✅ API `/api/os/[id]/validate-transition`
- ✅ Políticas configuráveis por organização
- ✅ APIs `/api/policies` e ativação
- ✅ Página de configurações de políticas `/dashboard/config/policies`
- ✅ Documentação: `FASE1_ALERTAS_VALIDACOES.md`, `POLICIES_CONFIGURABLES.md`, `IMPLEMENTACAO_COMPLETA.md`

---

## Fase 2 - UI e Fluxos

### 2.1 Integrar Alertas no Dashboard
- Tarefas
  - Exibir `AlertsSummary` no header do dashboard
  - Inserir `AlertsPanel` na home do dashboard
  - Botões de ação levando a telas corretas (OS, financeiro, fornecedores)
- Dependências: API `/api/alerts`
- Critérios de Aceite
  - Painel exibe contadores por severidade
  - Clique em um alerta navega corretamente
  - Estado “Tudo em ordem” quando zero alertas

### 2.2 Modal de Checklist para Mudança de Status
- Tarefas
  - Criar componente `StatusTransitionModal`
  - Chamar `/api/os/[id]/validate-transition` ao tentar avançar status
  - Exibir itens obrigatórios e recomendados com estado de conclusão
  - Bloquear avanço quando houver blockers obrigatórios
  - Botão “Forçar com justificativa” (opcional, registrar auditoria)
- Dependências: API de validação, serviço de auditoria
- Critérios de Aceite
  - Modal lista os itens com clareza (✓/✗)
  - Botão Avançar apenas quando `canProceed=true`
  - Registro de auditoria da tentativa (sucesso e falha)

### 2.3 Página de Alertas (Lista e Filtros)
- Tarefas
  - Página `dashboard/alerts`
  - Filtros por: severidade, categoria, OS, período
  - Paginação
- Critérios de Aceite
  - Listagem responsiva e com ordenação por data
  - Links para contexto (OS, fornecedor, etc.)

---

## Fase 3 - Observabilidade e Qualidade

### 3.1 Auditoria Ampliada
- Tarefas
  - Registrar mudança de política ativa (quem/quando/de→para)
  - Registrar snapshot em toda mudança de status (já previsto)
  - Registrar dismiss de alerta (com quem/quando/motivo)
- Critérios de Aceite
  - Timeline de auditoria por OS e por organização

### 3.2 Métricas e Monitoramento
- Tarefas
  - Contadores de alertas por severidade (diário/semana/mês)
  - Tempo médio de resolução de alertas críticos
  - Dashboard simples de métricas internas
- Critérios de Aceite
  - Relatórios básicos exportáveis (CSV)

### 3.3 Testes Automatizados
- Tarefas
  - Unitárias: regras de validação e alertas (com mocks de política)
  - Integração: APIs de policies, alerts, validation
  - E2E: fluxo de mudança de status com modal
- Critérios de Aceite
  - Cobertura mínima 70% em serviços de regras

---

## Fase 4 (Entregue) - Performance e Escalabilidade ✅

### 4.1 Otimização de Consultas ✅
- Tarefas
  - ✅ Reduzir includes pesados em `alerts.ts` (usar contadores/exists)
  - ✅ Indexes adicionais: datas, status, orgId + status
  - ✅ Estratégia de paginação em listas de alertas por período
- Critérios de Aceite
  - ✅ Tempo de resposta médio < 300ms nas APIs de leitura
- Documentação: [FASE4_PERFORMANCE.md](./FASE4_PERFORMANCE.md), [FASE4_RESUMO.md](./FASE4_RESUMO.md)

### 4.2 Cache e Reatividade ✅
- Tarefas
  - ✅ Cache de contadores de alertas por org (em memória, upgrade Redis futuro)
  - ✅ Invalidation ao criar/atualizar entidades relacionadas
  - ✅ Sistema completo de invalidação com hooks
- Critérios de Aceite
  - ✅ Queda de 50%+ em leituras repetidas de alertas
- Arquivos: `lib/cache/alerts-cache.ts`, `lib/cache/cache-invalidation.ts`

### 4.3 Jobs Assíncronos ✅
- Tarefas
  - ✅ Job periódico de recomputar alertas críticos (ex.: a cada hora)
  - ✅ Enfileirar notificações (email/WhatsApp/SMS/push)
  - ✅ APIs de gerenciamento de jobs e notificações
- Critérios de Aceite
  - ✅ Jobs idempotentes e observáveis (logs + métricas)
- Arquivos: `lib/jobs/alerts-refresh-job.ts`, `lib/jobs/notification-queue.ts`

---

## Fase 5 - Segurança e Governança

### 5.1 Permissões e Escopo
- Tarefas
  - Policies só visíveis/editáveis por admin org
  - Mudança de status: checagem de permissão por papel
  - Auditoria completa de quem altera políticas
- Critérios de Aceite
  - Tentativas sem permissão retornam 403

### 5.2 Versionamento e Rollback de Políticas
- Tarefas
  - Clonagem de políticas
  - Rollback rápido para versão anterior
  - Histórico de ativações com diffs (básico)
- Critérios de Aceite
  - Restauração de versão sem inconsistência (snapshots preservados)

### 5.3 Conformidade e Retenção
- Tarefas
  - Retenção de snapshots por período configurável
  - Exportação de política e snapshots (JSON)
- Critérios de Aceite
  - Exportação/Importação funcional e validada

---

## Apêndice A - APIs

- Alertas
  - GET `/api/alerts?orgId={orgId}`
- Validações de Status
  - POST `/api/os/[id]/validate-transition` { fromStatus, toStatus }
- Políticas
  - GET `/api/policies?orgId={orgId}`
  - POST `/api/policies` { orgId, nome, descricao?, financeiro, prazos, checklistsOverrides? }
  - GET `/api/policies/[id]`
  - PUT `/api/policies/[id]` { nome?, descricao?, financeiro?, prazos?, checklistsOverrides? }
  - POST `/api/policies/[id]/activate`

---

## Apêndice B - Modelos de Dados

- `OrganizacaoPolicy`
  - orgId, nome, descricao?, versao, ativa
  - financeiro: { margemMinimaPercentual, entradaMinimaPercentual, toleranciaCustoRealAcimaEstimadoPercentual }
  - prazos: { prazoMinimoGuiaDias, prazoMinimoMotoristaDias, prazoMinimoHospedagemDias }
  - checklistsOverrides?: Json
- `OSPolicySnapshot`
  - osId, policyId, versao, snapshot(Json), appliedAt

---

## Checklist Rápido por Prioridade

- Alta
  - [ ] Modal de Checklist (bloquear avanço) – F2.2
  - [ ] Integração Alerts no Dashboard – F2.1
  - [ ] Auditoria ampliada – F3.1
- Média
  - [ ] Página de Alertas (lista + filtros) – F2.3
  - [ ] Métricas básicas – F3.2
  - [x] ~~Otimizações de consulta em alerts – F4.1~~ ✅
- Baixa
  - [x] ~~Cache e jobs assíncronos – F4.2/F4.3~~ ✅
  - [ ] Rollback de políticas – F5.2
  - [ ] Exportação/Importação – F5.3

---

## Orientações de Execução
- Execute por “Fase” e por “subtarefa” para evitar PRs grandes
- Para cada subtarefa:
  1) Criar branch com nome claro (ex.: `feat/modal-status-checklist`)
  2) Implementar e cobrir com testes mínimos
  3) Atualizar docs e checklist
  4) Abrir PR pequeno e objetivo

---

Última atualização: 2025-11-01 (Fase 4 completa)
