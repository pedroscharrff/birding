-- Adicionar colunas financeiras na tabela OS que a migration deveria ter criado
-- Execute no Supabase SQL Editor

-- Adicionar colunas financeiras
ALTER TABLE os 
  ADD COLUMN IF NOT EXISTS valor_venda DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS moeda_venda "Moeda" NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS valor_recebido DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_estimado DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS custo_real DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS margem_estimada DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS obs_financeiras TEXT;

-- Adicionar colunas de controle de pagamento nas tabelas relacionadas
ALTER TABLE os_atividades
  ADD COLUMN IF NOT EXISTS status_pagamento "StatusPagamento" NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS data_pagamento DATE,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS referencia_pagamento TEXT;

ALTER TABLE os_hospedagens
  ADD COLUMN IF NOT EXISTS status_pagamento "StatusPagamento" NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS data_pagamento DATE,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS referencia_pagamento TEXT;

ALTER TABLE os_transportes
  ADD COLUMN IF NOT EXISTS status_pagamento "StatusPagamento" NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS data_pagamento DATE,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS referencia_pagamento TEXT;

ALTER TABLE os_passagens_aereas
  ADD COLUMN IF NOT EXISTS status_pagamento "StatusPagamento" NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS data_pagamento DATE,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS referencia_pagamento TEXT;

-- Verificar colunas criadas
SELECT 'Colunas da tabela OS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'os'
AND column_name IN ('valor_venda', 'moeda_venda', 'valor_recebido', 'custo_estimado', 'custo_real', 'margem_estimada', 'obs_financeiras')
ORDER BY column_name;

SELECT 'Colunas adicionadas com sucesso!' as resultado;
