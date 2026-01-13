-- Fix inconsistency introduced by migration 20260102151922_add_cotacoes_system
-- That migration replaced snake_case created_at with camelCase createdAt.
-- Prisma schema expects created_at (mapped), so we normalize the DB back to created_at.

DO $$
BEGIN
  -- Case 1: column exists as "createdAt" (camelCase) and not as created_at
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizacoes'
      AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizacoes'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.organizacoes RENAME COLUMN "createdAt" TO created_at;
  END IF;

  -- Case 2: both columns exist (unexpected), keep created_at and drop "createdAt" after copying values
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizacoes'
      AND column_name = 'createdAt'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizacoes'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'UPDATE public.organizacoes SET created_at = COALESCE(created_at, "createdAt")';
    ALTER TABLE public.organizacoes DROP COLUMN "createdAt";
  END IF;

  -- Ensure default exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizacoes'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.organizacoes ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;
