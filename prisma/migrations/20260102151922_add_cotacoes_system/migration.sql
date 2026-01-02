/*
  Warnings:

  - You are about to drop the column `created_at` on the `organizacoes` table. All the data in the column will be lost.
  - Added the required column `createdAt` to the `organizacoes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('pendente', 'parcial', 'pago', 'atrasado', 'cancelado');

-- CreateEnum
CREATE TYPE "StatusCotacao" AS ENUM ('rascunho', 'enviada', 'aceita', 'perdida', 'expirada');

-- CreateEnum
CREATE TYPE "CategoriaCotacaoItem" AS ENUM ('hospedagem', 'atividade', 'transporte', 'alimentacao');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CategoriaLancamento" ADD VALUE 'receita_tour';
ALTER TYPE "CategoriaLancamento" ADD VALUE 'comissao_agente';
ALTER TYPE "CategoriaLancamento" ADD VALUE 'comissao_guia';
ALTER TYPE "CategoriaLancamento" ADD VALUE 'reembolso';
ALTER TYPE "CategoriaLancamento" ADD VALUE 'cancelamento';

-- AlterEnum
ALTER TYPE "EntidadeAuditoria" ADD VALUE 'pagamento_os';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoLancamento" ADD VALUE 'receita_os';
ALTER TYPE "TipoLancamento" ADD VALUE 'comissao';

-- AlterTable
ALTER TABLE "organizacoes" DROP COLUMN "created_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "os" ADD COLUMN     "custo_estimado" DECIMAL(12,2),
ADD COLUMN     "custo_real" DECIMAL(12,2),
ADD COLUMN     "margem_estimada" DECIMAL(5,2),
ADD COLUMN     "moeda_venda" "Moeda" NOT NULL DEFAULT 'BRL',
ADD COLUMN     "obs_financeiras" TEXT,
ADD COLUMN     "valor_recebido" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "valor_venda" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "os_atividades" ADD COLUMN     "data_pagamento" DATE,
ADD COLUMN     "forma_pagamento" TEXT,
ADD COLUMN     "referencia_pagamento" TEXT,
ADD COLUMN     "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente';

-- AlterTable
ALTER TABLE "os_hospedagens" ADD COLUMN     "data_pagamento" DATE,
ADD COLUMN     "forma_pagamento" TEXT,
ADD COLUMN     "referencia_pagamento" TEXT,
ADD COLUMN     "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente';

-- AlterTable
ALTER TABLE "os_passagens_aereas" ADD COLUMN     "data_pagamento" DATE,
ADD COLUMN     "forma_pagamento" TEXT,
ADD COLUMN     "referencia_pagamento" TEXT,
ADD COLUMN     "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente';

-- AlterTable
ALTER TABLE "os_transportes" ADD COLUMN     "data_pagamento" DATE,
ADD COLUMN     "forma_pagamento" TEXT,
ADD COLUMN     "referencia_pagamento" TEXT,
ADD COLUMN     "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente';

-- CreateTable
CREATE TABLE "os_pagamentos" (
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

-- CreateTable
CREATE TABLE "organizacao_policies" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "financeiro" JSONB NOT NULL,
    "prazos" JSONB NOT NULL,
    "checklists_overrides" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizacao_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_policy_snapshots" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "os_policy_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotacoes" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cliente_nome" TEXT NOT NULL,
    "cliente_email" TEXT,
    "cliente_telefone" TEXT,
    "destino" TEXT NOT NULL,
    "data_inicio" DATE,
    "data_fim" DATE,
    "status_cotacao" "StatusCotacao" NOT NULL DEFAULT 'rascunho',
    "observacoes_internas" TEXT,
    "observacoes_cliente" TEXT,
    "responsavel_id" TEXT NOT NULL,
    "valor_total" DECIMAL(12,2),
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotacao_itens" (
    "id" TEXT NOT NULL,
    "cotacao_id" TEXT NOT NULL,
    "categoria" "CategoriaCotacaoItem" NOT NULL,
    "fornecedor_id" TEXT,
    "tarifa_id" TEXT,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor_unitario" DECIMAL(12,2) NOT NULL,
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotacao_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "os_pagamentos_org_id_idx" ON "os_pagamentos"("org_id");

-- CreateIndex
CREATE INDEX "os_pagamentos_os_id_idx" ON "os_pagamentos"("os_id");

-- CreateIndex
CREATE INDEX "os_pagamentos_tipo_idx" ON "os_pagamentos"("tipo");

-- CreateIndex
CREATE INDEX "os_pagamentos_status_idx" ON "os_pagamentos"("status");

-- CreateIndex
CREATE INDEX "os_pagamentos_data_vencimento_idx" ON "os_pagamentos"("data_vencimento");

-- CreateIndex
CREATE INDEX "os_pagamentos_data_pagamento_idx" ON "os_pagamentos"("data_pagamento");

-- CreateIndex
CREATE INDEX "os_pagamentos_fornecedor_id_idx" ON "os_pagamentos"("fornecedor_id");

-- CreateIndex
CREATE INDEX "os_pagamentos_org_id_status_data_vencimento_idx" ON "os_pagamentos"("org_id", "status", "data_vencimento");

-- CreateIndex
CREATE INDEX "os_pagamentos_status_data_vencimento_idx" ON "os_pagamentos"("status", "data_vencimento");

-- CreateIndex
CREATE INDEX "organizacao_policies_org_id_idx" ON "organizacao_policies"("org_id");

-- CreateIndex
CREATE INDEX "organizacao_policies_org_id_ativa_idx" ON "organizacao_policies"("org_id", "ativa");

-- CreateIndex
CREATE INDEX "organizacao_policies_org_id_versao_idx" ON "organizacao_policies"("org_id", "versao");

-- CreateIndex
CREATE INDEX "os_policy_snapshots_os_id_idx" ON "os_policy_snapshots"("os_id");

-- CreateIndex
CREATE INDEX "os_policy_snapshots_policy_id_idx" ON "os_policy_snapshots"("policy_id");

-- CreateIndex
CREATE INDEX "cotacoes_org_id_idx" ON "cotacoes"("org_id");

-- CreateIndex
CREATE INDEX "cotacoes_responsavel_id_idx" ON "cotacoes"("responsavel_id");

-- CreateIndex
CREATE INDEX "cotacoes_status_cotacao_idx" ON "cotacoes"("status_cotacao");

-- CreateIndex
CREATE INDEX "cotacoes_data_inicio_idx" ON "cotacoes"("data_inicio");

-- CreateIndex
CREATE INDEX "cotacoes_created_at_idx" ON "cotacoes"("created_at");

-- CreateIndex
CREATE INDEX "cotacao_itens_cotacao_id_idx" ON "cotacao_itens"("cotacao_id");

-- CreateIndex
CREATE INDEX "cotacao_itens_fornecedor_id_idx" ON "cotacao_itens"("fornecedor_id");

-- CreateIndex
CREATE INDEX "cotacao_itens_categoria_idx" ON "cotacao_itens"("categoria");

-- CreateIndex
CREATE INDEX "os_atividades_status_pagamento_idx" ON "os_atividades"("status_pagamento");

-- CreateIndex
CREATE INDEX "os_atividades_status_pagamento_data_idx" ON "os_atividades"("status_pagamento", "data");

-- CreateIndex
CREATE INDEX "os_hospedagens_status_pagamento_idx" ON "os_hospedagens"("status_pagamento");

-- CreateIndex
CREATE INDEX "os_hospedagens_status_pagamento_checkout_idx" ON "os_hospedagens"("status_pagamento", "checkout");

-- CreateIndex
CREATE INDEX "os_passagens_aereas_status_pagamento_idx" ON "os_passagens_aereas"("status_pagamento");

-- CreateIndex
CREATE INDEX "os_transportes_status_pagamento_idx" ON "os_transportes"("status_pagamento");

-- CreateIndex
CREATE INDEX "os_transportes_status_pagamento_data_partida_idx" ON "os_transportes"("status_pagamento", "data_partida");

-- AddForeignKey
ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizacao_policies" ADD CONSTRAINT "organizacao_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_policy_snapshots" ADD CONSTRAINT "os_policy_snapshots_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_policy_snapshots" ADD CONSTRAINT "os_policy_snapshots_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "organizacao_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacoes" ADD CONSTRAINT "cotacoes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacoes" ADD CONSTRAINT "cotacoes_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacao_itens" ADD CONSTRAINT "cotacao_itens_cotacao_id_fkey" FOREIGN KEY ("cotacao_id") REFERENCES "cotacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacao_itens" ADD CONSTRAINT "cotacao_itens_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
