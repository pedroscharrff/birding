-- ============================================
-- SOLUÇÃO DEFINITIVA - Baseada na Análise de Todas as Migrations
-- ============================================
-- Execute este script COMPLETO no Supabase SQL Editor
-- Ele detecta o estado atual e aplica apenas o necessário

-- ============================================
-- PARTE 0: Criar enums necessários (se não existirem)
-- ============================================

-- Criar enum StatusPagamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusPagamento') THEN
        CREATE TYPE "StatusPagamento" AS ENUM ('pendente', 'parcial', 'pago', 'atrasado', 'cancelado');
        RAISE NOTICE '✓ Enum StatusPagamento criado';
    ELSE
        RAISE NOTICE '✓ Enum StatusPagamento já existe';
    END IF;
END $$;

-- Criar enum StatusCotacao
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusCotacao') THEN
        CREATE TYPE "StatusCotacao" AS ENUM ('rascunho', 'enviada', 'aceita', 'perdida', 'expirada');
        RAISE NOTICE '✓ Enum StatusCotacao criado';
    ELSE
        RAISE NOTICE '✓ Enum StatusCotacao já existe';
    END IF;
END $$;

-- Criar enum CategoriaCotacaoItem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CategoriaCotacaoItem') THEN
        CREATE TYPE "CategoriaCotacaoItem" AS ENUM ('hospedagem', 'atividade', 'transporte', 'alimentacao');
        RAISE NOTICE '✓ Enum CategoriaCotacaoItem criado';
    ELSE
        RAISE NOTICE '✓ Enum CategoriaCotacaoItem já existe';
    END IF;
END $$;

-- ============================================
-- PARTE 1: Verificar e corrigir coluna em organizacoes
-- ============================================

-- Se existe createdAt, renomear para created_at
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizacoes' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE organizacoes RENAME COLUMN "createdAt" TO created_at;
        RAISE NOTICE '✓ Coluna createdAt renomeada para created_at';
    ELSE
        RAISE NOTICE '✓ Coluna created_at já existe corretamente';
    END IF;
END $$;

-- Se não existe created_at, criar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizacoes' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE organizacoes ADD COLUMN created_at TIMESTAMP(3) DEFAULT NOW() NOT NULL;
        RAISE NOTICE '✓ Coluna created_at criada';
    END IF;
END $$;

-- ============================================
-- PARTE 2: Adicionar colunas financeiras em OS
-- ============================================

DO $$
BEGIN
    -- valor_venda
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os' AND column_name = 'valor_venda'
    ) THEN
        ALTER TABLE os ADD COLUMN valor_venda DECIMAL(12,2);
        RAISE NOTICE '✓ Coluna valor_venda adicionada em os';
    END IF;

    -- moeda_venda
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os' AND column_name = 'moeda_venda'
    ) THEN
        ALTER TABLE os ADD COLUMN moeda_venda "Moeda" NOT NULL DEFAULT 'BRL';
        RAISE NOTICE '✓ Coluna moeda_venda adicionada em os';
    END IF;

    -- valor_recebido
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os' AND column_name = 'valor_recebido'
    ) THEN
        ALTER TABLE os ADD COLUMN valor_recebido DECIMAL(12,2) DEFAULT 0;
        RAISE NOTICE '✓ Coluna valor_recebido adicionada em os';
    END IF;

    -- custo_estimado
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os' AND column_name = 'custo_estimado'
    ) THEN
        ALTER TABLE os ADD COLUMN custo_estimado DECIMAL(12,2);
        RAISE NOTICE '✓ Coluna custo_estimado adicionada em os';
    END IF;

    -- custo_real
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os' AND column_name = 'custo_real'
    ) THEN
        ALTER TABLE os ADD COLUMN custo_real DECIMAL(12,2);
        RAISE NOTICE '✓ Coluna custo_real adicionada em os';
    END IF;

    -- margem_estimada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os' AND column_name = 'margem_estimada'
    ) THEN
        ALTER TABLE os ADD COLUMN margem_estimada DECIMAL(5,2);
        RAISE NOTICE '✓ Coluna margem_estimada adicionada em os';
    END IF;

    -- obs_financeiras
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os' AND column_name = 'obs_financeiras'
    ) THEN
        ALTER TABLE os ADD COLUMN obs_financeiras TEXT;
        RAISE NOTICE '✓ Coluna obs_financeiras adicionada em os';
    END IF;
END $$;

-- ============================================
-- PARTE 3: Adicionar colunas de pagamento em os_atividades
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os_atividades' AND column_name = 'status_pagamento'
    ) THEN
        ALTER TABLE os_atividades 
            ADD COLUMN status_pagamento "StatusPagamento" NOT NULL DEFAULT 'pendente',
            ADD COLUMN data_pagamento DATE,
            ADD COLUMN forma_pagamento TEXT,
            ADD COLUMN referencia_pagamento TEXT;
        RAISE NOTICE '✓ Colunas de pagamento adicionadas em os_atividades';
    ELSE
        RAISE NOTICE '✓ Colunas de pagamento já existem em os_atividades';
    END IF;
END $$;

-- ============================================
-- PARTE 4: Adicionar colunas de pagamento em os_hospedagens
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os_hospedagens' AND column_name = 'status_pagamento'
    ) THEN
        ALTER TABLE os_hospedagens 
            ADD COLUMN status_pagamento "StatusPagamento" NOT NULL DEFAULT 'pendente',
            ADD COLUMN data_pagamento DATE,
            ADD COLUMN forma_pagamento TEXT,
            ADD COLUMN referencia_pagamento TEXT;
        RAISE NOTICE '✓ Colunas de pagamento adicionadas em os_hospedagens';
    ELSE
        RAISE NOTICE '✓ Colunas de pagamento já existem em os_hospedagens';
    END IF;
END $$;

-- ============================================
-- PARTE 5: Adicionar colunas de pagamento em os_transportes
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os_transportes' AND column_name = 'status_pagamento'
    ) THEN
        ALTER TABLE os_transportes 
            ADD COLUMN status_pagamento "StatusPagamento" NOT NULL DEFAULT 'pendente',
            ADD COLUMN data_pagamento DATE,
            ADD COLUMN forma_pagamento TEXT,
            ADD COLUMN referencia_pagamento TEXT;
        RAISE NOTICE '✓ Colunas de pagamento adicionadas em os_transportes';
    ELSE
        RAISE NOTICE '✓ Colunas de pagamento já existem em os_transportes';
    END IF;
END $$;

-- ============================================
-- PARTE 6: Adicionar colunas de pagamento em os_passagens_aereas
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'os_passagens_aereas' AND column_name = 'status_pagamento'
    ) THEN
        ALTER TABLE os_passagens_aereas 
            ADD COLUMN status_pagamento "StatusPagamento" NOT NULL DEFAULT 'pendente',
            ADD COLUMN data_pagamento DATE,
            ADD COLUMN forma_pagamento TEXT,
            ADD COLUMN referencia_pagamento TEXT;
        RAISE NOTICE '✓ Colunas de pagamento adicionadas em os_passagens_aereas';
    ELSE
        RAISE NOTICE '✓ Colunas de pagamento já existem em os_passagens_aereas';
    END IF;
END $$;

-- ============================================
-- PARTE 7: Criar organização padrão
-- ============================================

INSERT INTO organizacoes (id, nome, created_at, updated_at)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Birding Tours',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    nome = EXCLUDED.nome,
    updated_at = NOW();

-- ============================================
-- PARTE 8: Criar usuário admin
-- ============================================
-- Senha: admin123
-- Hash bcrypt: $2b$10$K7L1OJ45/4Y2nX6K0H6bde6nv8lyezRZbvbZ8g5xKzXqJqYqZqK7e

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
)
VALUES (
    'user-admin-001',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Administrador',
    'admin@birdingtours.com',
    NULL,
    'admin',
    '$2b$10$K7L1OJ45/4Y2nX6K0H6bde6nv8lyezRZbvbZ8g5xKzXqJqYqZqK7e',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET 
    hash_senha = EXCLUDED.hash_senha,
    org_id = EXCLUDED.org_id,
    ativo = true,
    updated_at = NOW();

-- ============================================
-- PARTE 9: Verificação Final
-- ============================================

SELECT '
╔════════════════════════════════════════════════════════════╗
║                  CORREÇÃO APLICADA COM SUCESSO!            ║
╚════════════════════════════════════════════════════════════╝

📊 DADOS CRIADOS:
' as resultado;

SELECT 
    'Organizações' as tabela, 
    COUNT(*) as total 
FROM organizacoes
UNION ALL
SELECT 
    'Usuários' as tabela, 
    COUNT(*) as total 
FROM usuarios
UNION ALL
SELECT 
    'Fornecedores' as tabela, 
    COUNT(*) as total 
FROM fornecedores
UNION ALL
SELECT 
    'OS' as tabela, 
    COUNT(*) as total 
FROM os;

SELECT '
🔑 DADOS DE LOGIN:
   Email: admin@birdingtours.com
   Senha: admin123

⚠️  IMPORTANTE: Troque a senha após o primeiro login!

📋 PRÓXIMOS PASSOS:
   1. Regenerar Prisma Client: npx prisma generate
   2. Reiniciar servidor: npm run dev
   3. Fazer login no sistema
   4. Testar funcionalidades

✅ Banco de dados corrigido e pronto para uso!
' as instrucoes;
