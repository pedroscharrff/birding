-- SCRIPT DE CORREÇÃO COMPLETA
-- Execute este script COMPLETO no Supabase SQL Editor
-- Ele corrige TODOS os problemas da migration

-- ============================================
-- PARTE 1: Corrigir coluna created_at em organizacoes
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizacoes' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE organizacoes RENAME COLUMN "createdAt" TO created_at;
        RAISE NOTICE 'Coluna createdAt renomeada para created_at';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizacoes' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE organizacoes ADD COLUMN created_at TIMESTAMP(3) DEFAULT NOW();
        UPDATE organizacoes SET created_at = NOW() WHERE created_at IS NULL;
        ALTER TABLE organizacoes ALTER COLUMN created_at SET NOT NULL;
        RAISE NOTICE 'Coluna created_at criada';
    END IF;
END $$;

-- ============================================
-- PARTE 2: Adicionar colunas financeiras na tabela OS
-- ============================================

ALTER TABLE os 
  ADD COLUMN IF NOT EXISTS valor_venda DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS moeda_venda "Moeda" NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS valor_recebido DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_estimado DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS custo_real DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS margem_estimada DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS obs_financeiras TEXT;

-- ============================================
-- PARTE 3: Adicionar colunas de pagamento nas tabelas relacionadas
-- ============================================

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

-- ============================================
-- PARTE 4: Criar organização e usuário admin
-- ============================================

INSERT INTO organizacoes (id, nome, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Birding Tours',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, updated_at = NOW();

INSERT INTO usuarios (
  id, org_id, nome, email, role_global, hash_senha, ativo, created_at, updated_at
)
VALUES (
  'user-admin-001',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Administrador',
  'admin@birdingtours.com',
  'admin',
  '$2b$10$K7L1OJ45/4Y2nX6K0H6bde6nv8lyezRZbvbZ8g5xKzXqJqYqZqK7e',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  hash_senha = EXCLUDED.hash_senha,
  org_id = EXCLUDED.org_id,
  ativo = true;

-- ============================================
-- PARTE 5: Verificar resultado
-- ============================================

SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 'Organizações:' as tipo, COUNT(*) as total FROM organizacoes
UNION ALL
SELECT 'Usuários:' as tipo, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'OS:' as tipo, COUNT(*) as total FROM os;

SELECT '=== DADOS DE LOGIN ===' as info;
SELECT 
    '
    ================================
    CORREÇÃO COMPLETA APLICADA!
    ================================
    
    Email: admin@birdingtours.com
    Senha: admin123
    
    Próximos passos:
    1. Regenerar Prisma Client: npx prisma generate
    2. Reiniciar servidor: npm run dev
    3. Fazer login no sistema
    
    ================================
    ' as resultado;
