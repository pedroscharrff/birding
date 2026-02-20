-- =============================================================
-- CORREÇÃO DE DATAS COM OFFSET DE FUSO HORÁRIO
-- =============================================================
-- 
-- CONTEXTO:
--   O bug: `new Date("2026-02-20")` em JavaScript cria uma data como
--   UTC midnight (2026-02-20T00:00:00.000Z). Quando o servidor PostgreSQL
--   está configurado em um fuso horário negativo (ex: America/Sao_Paulo
--   UTC-3/-4), ao armazenar em colunas DATE o Postgres converte para
--   horário local e trunca, resultando em 2026-02-19.
--
-- COMO IDENTIFICAR SE VOCÊ PRECISA DISSO:
--   Execute: SHOW timezone;
--   - Se retornar 'UTC' ou 'Etc/UTC': provavelmente as datas estão corretas
--     no banco e o bug era só de exibição no frontend. NÃO rode este script.
--   - Se retornar 'America/Sao_Paulo' ou similar (UTC negativo): rode.
--
-- EFEITO:
--   Adiciona 1 dia em TODAS as datas afetadas. Execute UMA VEZ apenas.
--   Se já rodou uma vez, NÃO rode novamente (não é idempotente).
--
-- RECOMENDAÇÃO: tire um backup antes de executar.
-- =============================================================

-- Verificar o timezone do servidor antes de executar:
-- SELECT current_setting('timezone');

-- ========================
-- os: data_inicio, data_fim
-- ========================
UPDATE "os"
SET
  "data_inicio" = "data_inicio" + INTERVAL '1 day',
  "data_fim"    = "data_fim"    + INTERVAL '1 day'
WHERE
  "deleted_at" IS NULL;  -- só atualiza OS ativas

-- ========================
-- os_extensoes: data_inicio, data_fim
-- ========================
UPDATE "os_extensoes"
SET
  "data_inicio" = "data_inicio" + INTERVAL '1 day',
  "data_fim"    = "data_fim"    + INTERVAL '1 day';

-- ========================
-- os_hospedagens: checkin, checkout
-- ========================
UPDATE "os_hospedagens"
SET
  "checkin"  = "checkin"  + INTERVAL '1 day',
  "checkout" = "checkout" + INTERVAL '1 day';

-- ========================
-- os_atividades: data
-- ========================
UPDATE "os_atividades"
SET "data" = "data" + INTERVAL '1 day'
WHERE "data" IS NOT NULL;

-- ========================
-- os_transportes: data_partida, data_chegada
-- ========================
UPDATE "os_transportes"
SET
  "data_partida" = "data_partida" + INTERVAL '1 day',
  "data_chegada" = "data_chegada" + INTERVAL '1 day'
WHERE "data_partida" IS NOT NULL
   OR "data_chegada" IS NOT NULL;

-- ========================
-- os_passagens_aereas: data_partida, data_chegada
-- ========================
UPDATE "os_passagens_aereas"
SET
  "data_partida" = "data_partida" + INTERVAL '1 day',
  "data_chegada" = "data_chegada" + INTERVAL '1 day'
WHERE "data_partida" IS NOT NULL
   OR "data_chegada" IS NOT NULL;

-- ========================
-- os_pagamentos: data_vencimento, data_pagamento
-- ========================
UPDATE "os_pagamentos"
SET
  "data_vencimento" = "data_vencimento" + INTERVAL '1 day',
  "data_pagamento"  = CASE
    WHEN "data_pagamento" IS NOT NULL THEN "data_pagamento" + INTERVAL '1 day'
    ELSE NULL
  END;

-- ========================
-- os_participantes: passaporte_validade
-- ========================
UPDATE "os_participantes"
SET "passaporte_validade" = "passaporte_validade" + INTERVAL '1 day'
WHERE "passaporte_validade" IS NOT NULL;
