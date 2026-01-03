-- CreateEnum (se não existir)
DO $$ BEGIN
 CREATE TYPE "StatusPagamento" AS ENUM ('pendente', 'parcial', 'pago', 'atrasado', 'cancelado');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "os_pagamentos" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "data_vencimento" DATE NOT NULL,
    "data_pagamento" DATE,
    "status" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "forma_pagamento" TEXT,
    "referencia" TEXT,
    "comprovante_url" TEXT,
    "fornecedor_id" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "os_pagamentos_org_id_idx" ON "os_pagamentos"("org_id");
CREATE INDEX IF NOT EXISTS "os_pagamentos_os_id_idx" ON "os_pagamentos"("os_id");
CREATE INDEX IF NOT EXISTS "os_pagamentos_tipo_idx" ON "os_pagamentos"("tipo");
CREATE INDEX IF NOT EXISTS "os_pagamentos_status_idx" ON "os_pagamentos"("status");
CREATE INDEX IF NOT EXISTS "os_pagamentos_data_vencimento_idx" ON "os_pagamentos"("data_vencimento");
CREATE INDEX IF NOT EXISTS "os_pagamentos_data_pagamento_idx" ON "os_pagamentos"("data_pagamento");
CREATE INDEX IF NOT EXISTS "os_pagamentos_fornecedor_id_idx" ON "os_pagamentos"("fornecedor_id");
CREATE INDEX IF NOT EXISTS "os_pagamentos_org_id_status_data_vencimento_idx" ON "os_pagamentos"("org_id", "status", "data_vencimento");
CREATE INDEX IF NOT EXISTS "os_pagamentos_status_data_vencimento_idx" ON "os_pagamentos"("status", "data_vencimento");

-- AddForeignKey (apenas se a tabela foi criada)
DO $$ BEGIN
 ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Adicionar campos de status_pagamento nas tabelas relacionadas (se não existirem)
ALTER TABLE "os_atividades" ADD COLUMN IF NOT EXISTS "data_pagamento" DATE;
ALTER TABLE "os_atividades" ADD COLUMN IF NOT EXISTS "forma_pagamento" TEXT;
ALTER TABLE "os_atividades" ADD COLUMN IF NOT EXISTS "referencia_pagamento" TEXT;
ALTER TABLE "os_atividades" ADD COLUMN IF NOT EXISTS "status_pagamento" "StatusPagamento" DEFAULT 'pendente';

ALTER TABLE "os_hospedagens" ADD COLUMN IF NOT EXISTS "data_pagamento" DATE;
ALTER TABLE "os_hospedagens" ADD COLUMN IF NOT EXISTS "forma_pagamento" TEXT;
ALTER TABLE "os_hospedagens" ADD COLUMN IF NOT EXISTS "referencia_pagamento" TEXT;
ALTER TABLE "os_hospedagens" ADD COLUMN IF NOT EXISTS "status_pagamento" "StatusPagamento" DEFAULT 'pendente';

ALTER TABLE "os_passagens_aereas" ADD COLUMN IF NOT EXISTS "data_pagamento" DATE;
ALTER TABLE "os_passagens_aereas" ADD COLUMN IF NOT EXISTS "forma_pagamento" TEXT;
ALTER TABLE "os_passagens_aereas" ADD COLUMN IF NOT EXISTS "referencia_pagamento" TEXT;
ALTER TABLE "os_passagens_aereas" ADD COLUMN IF NOT EXISTS "status_pagamento" "StatusPagamento" DEFAULT 'pendente';

ALTER TABLE "os_transportes" ADD COLUMN IF NOT EXISTS "data_pagamento" DATE;
ALTER TABLE "os_transportes" ADD COLUMN IF NOT EXISTS "forma_pagamento" TEXT;
ALTER TABLE "os_transportes" ADD COLUMN IF NOT EXISTS "referencia_pagamento" TEXT;
ALTER TABLE "os_transportes" ADD COLUMN IF NOT EXISTS "status_pagamento" "StatusPagamento" DEFAULT 'pendente';

-- Criar índices nas tabelas relacionadas (se não existirem)
CREATE INDEX IF NOT EXISTS "os_atividades_status_pagamento_idx" ON "os_atividades"("status_pagamento");
CREATE INDEX IF NOT EXISTS "os_atividades_status_pagamento_data_idx" ON "os_atividades"("status_pagamento", "data");

CREATE INDEX IF NOT EXISTS "os_hospedagens_status_pagamento_idx" ON "os_hospedagens"("status_pagamento");
CREATE INDEX IF NOT EXISTS "os_hospedagens_status_pagamento_checkout_idx" ON "os_hospedagens"("status_pagamento", "checkout");

CREATE INDEX IF NOT EXISTS "os_passagens_aereas_status_pagamento_idx" ON "os_passagens_aereas"("status_pagamento");

CREATE INDEX IF NOT EXISTS "os_transportes_status_pagamento_idx" ON "os_transportes"("status_pagamento");
CREATE INDEX IF NOT EXISTS "os_transportes_status_pagamento_data_partida_idx" ON "os_transportes"("status_pagamento", "data_partida");
