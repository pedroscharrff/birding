-- =============================================================
-- MIGRAÇÃO SEGURA PARA PRODUÇÃO
-- Usa IF NOT EXISTS em tudo — pode ser executada múltiplas vezes
-- sem risco de perda de dados.
-- =============================================================

-- ========================
-- ENUMs (só cria se não existir)
-- ========================

DO $$ BEGIN
  CREATE TYPE "TipoAtividade" AS ENUM ('atividade', 'alimentacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RegimeHospedagem" AS ENUM ('sem_cafe', 'cafe', 'meia_pensao', 'pensao_completa', 'all_inclusive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CategoriaPassagemAerea" AS ENUM ('cliente', 'guia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TipoEventoCalendario" AS ENUM ('chegada', 'saida', 'atividade', 'transporte', 'checkpoint');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RecursoCalendario" AS ENUM ('guia', 'motorista', 'veiculo', 'fornecedor', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AcaoAuditoria" AS ENUM ('criar', 'atualizar', 'excluir', 'visualizar', 'exportar', 'status_alterado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EntidadeAuditoria" AS ENUM ('os', 'participante', 'fornecedor_os', 'atividade', 'hospedagem', 'transporte', 'passagem_aerea', 'guia_designacao', 'motorista_designacao', 'scouting', 'lancamento_financeiro', 'pagamento_os', 'anotacao', 'extensao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PresetTipo" AS ENUM ('alergia', 'restricao', 'preferencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusCotacao" AS ENUM ('rascunho', 'enviada', 'aceita', 'perdida', 'expirada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CategoriaCotacaoItem" AS ENUM ('hospedagem', 'atividade', 'transporte', 'alimentacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusInvoice" AS ENUM ('rascunho', 'enviado', 'pago', 'cancelado', 'vencido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Adiciona 'suv' ao enum TipoTransporte se não existir
DO $$ BEGIN
  ALTER TYPE "TipoTransporte" ADD VALUE IF NOT EXISTS 'suv';
EXCEPTION WHEN others THEN NULL; END $$;

-- Adiciona valores ao TipoLancamento se não existirem
DO $$ BEGIN
  ALTER TYPE "TipoLancamento" ADD VALUE IF NOT EXISTS 'receita_os';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "TipoLancamento" ADD VALUE IF NOT EXISTS 'comissao';
EXCEPTION WHEN others THEN NULL; END $$;

-- Adiciona valores ao CategoriaLancamento se não existirem
DO $$ BEGIN
  ALTER TYPE "CategoriaLancamento" ADD VALUE IF NOT EXISTS 'receita_tour';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "CategoriaLancamento" ADD VALUE IF NOT EXISTS 'comissao_agente';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "CategoriaLancamento" ADD VALUE IF NOT EXISTS 'comissao_guia';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "CategoriaLancamento" ADD VALUE IF NOT EXISTS 'reembolso';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE "CategoriaLancamento" ADD VALUE IF NOT EXISTS 'cancelamento';
EXCEPTION WHEN others THEN NULL; END $$;

-- ========================
-- COLUNAS NOVAS EM TABELAS EXISTENTES
-- ========================

-- Tabela: os (soft delete)
ALTER TABLE "os" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "os" ADD COLUMN IF NOT EXISTS "deleted_by" TEXT;

-- Tabela: usuarios (permissões e hierarquia)
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "permissoes" JSONB;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "departamento" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "cargo" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "supervisor_id" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "ultimo_acesso" TIMESTAMP(3);

-- Tabela: fornecedores (arquivos)
ALTER TABLE "fornecedores" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;

-- Tabela: fornecedor_tarifas (campos hotelaria)
ALTER TABLE "fornecedor_tarifas" ADD COLUMN IF NOT EXISTS "tipo_quarto" TEXT;
ALTER TABLE "fornecedor_tarifas" ADD COLUMN IF NOT EXISTS "regime" TEXT;
ALTER TABLE "fornecedor_tarifas" ADD COLUMN IF NOT EXISTS "quartos" INTEGER;

-- Tabela: os_atividades (tipo e extensao)
ALTER TABLE "os_atividades" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;
ALTER TABLE "os_atividades" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;
DO $$ BEGIN
  ALTER TABLE "os_atividades" ADD COLUMN "tipo" "TipoAtividade" NOT NULL DEFAULT 'atividade';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Tabela: os_hospedagens (campos novos)
ALTER TABLE "os_hospedagens" ADD COLUMN IF NOT EXISTS "tarifa_id" TEXT;
ALTER TABLE "os_hospedagens" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;
ALTER TABLE "os_hospedagens" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;
ALTER TABLE "os_hospedagens" ADD COLUMN IF NOT EXISTS "reservas_refs" JSONB;
DO $$ BEGIN
  ALTER TABLE "os_hospedagens" ADD COLUMN "regime" "RegimeHospedagem";
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Tabela: os_transportes (extensao e arquivos)
ALTER TABLE "os_transportes" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;
ALTER TABLE "os_transportes" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;
ALTER TABLE "os_transportes" ADD COLUMN IF NOT EXISTS "detalhes" JSONB;

-- Tabela: os_passagens_aereas (extensao e arquivos)
ALTER TABLE "os_passagens_aereas" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;
ALTER TABLE "os_passagens_aereas" ADD COLUMN IF NOT EXISTS "arquivos" JSONB;

-- Tabela: os_guias_designacao (extensao)
ALTER TABLE "os_guias_designacao" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;

-- Tabela: os_motoristas_designacao (extensao e veiculo_tipo)
ALTER TABLE "os_motoristas_designacao" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;
DO $$ BEGIN
  ALTER TABLE "os_motoristas_designacao" ADD COLUMN "veiculo_tipo" "TipoTransporte";
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Tabela: financeiro_lancamentos (extensao)
ALTER TABLE "financeiro_lancamentos" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;

-- Tabela: os_pagamentos (extensao e percentual_parcial)
ALTER TABLE "os_pagamentos" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;
ALTER TABLE "os_pagamentos" ADD COLUMN IF NOT EXISTS "percentual_parcial" DECIMAL(5,2);

-- Tabela: os_historico_status (extensao)
ALTER TABLE "os_historico_status" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;

-- Tabela: auditoria_os (extensao)
ALTER TABLE "auditoria_os" ADD COLUMN IF NOT EXISTS "extensao_id" TEXT;

-- Tabela: os_participantes (campos novos)
ALTER TABLE "os_participantes" ADD COLUMN IF NOT EXISTS "idade" INTEGER;
ALTER TABLE "os_participantes" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;
ALTER TABLE "os_participantes" ADD COLUMN IF NOT EXISTS "documentos" JSONB;

-- ========================
-- NOVAS TABELAS
-- ========================

-- os_extensoes
CREATE TABLE IF NOT EXISTS "os_extensoes" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusOS" NOT NULL DEFAULT 'planejamento',
    "valor_venda" DECIMAL(12,2),
    "moeda_venda" "Moeda" NOT NULL DEFAULT 'BRL',
    "valor_recebido" DECIMAL(12,2) DEFAULT 0,
    "custo_estimado" DECIMAL(12,2),
    "custo_real" DECIMAL(12,2),
    "margem_estimada" DECIMAL(5,2),
    "obs_financeiras" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "os_extensoes_pkey" PRIMARY KEY ("id")
);

-- preset_categories
CREATE TABLE IF NOT EXISTS "preset_categories" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "PresetTipo" NOT NULL,
    "parent_id" TEXT,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preset_categories_pkey" PRIMARY KEY ("id")
);

-- preset_items
CREATE TABLE IF NOT EXISTS "preset_items" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "categoria_id" TEXT,
    "tipo" "PresetTipo" NOT NULL,
    "label" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "uso_count" INTEGER NOT NULL DEFAULT 0,
    "ultimo_uso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preset_items_pkey" PRIMARY KEY ("id")
);

-- preset_templates
CREATE TABLE IF NOT EXISTS "preset_templates" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "PresetTipo" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "uso_count" INTEGER NOT NULL DEFAULT 0,
    "ultimo_uso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preset_templates_pkey" PRIMARY KEY ("id")
);

-- preset_template_items
CREATE TABLE IF NOT EXISTS "preset_template_items" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "ordem" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preset_template_items_pkey" PRIMARY KEY ("id")
);

-- auditoria_os
CREATE TABLE IF NOT EXISTS "auditoria_os" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "usuario_nome" TEXT NOT NULL,
    "usuario_role" "RoleGlobal" NOT NULL,
    "acao" "AcaoAuditoria" NOT NULL,
    "entidade" "EntidadeAuditoria" NOT NULL,
    "entidade_id" TEXT,
    "dados_antigos" JSONB,
    "dados_novos" JSONB,
    "campos" TEXT[],
    "descricao" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extensao_id" TEXT,
    CONSTRAINT "auditoria_os_pkey" PRIMARY KEY ("id")
);

-- organizacao_policies
CREATE TABLE IF NOT EXISTS "organizacao_policies" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "financeiro" JSONB NOT NULL DEFAULT '{}',
    "prazos" JSONB NOT NULL DEFAULT '{}',
    "checklists_overrides" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizacao_policies_pkey" PRIMARY KEY ("id")
);

-- os_policy_snapshots
CREATE TABLE IF NOT EXISTS "os_policy_snapshots" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "os_policy_snapshots_pkey" PRIMARY KEY ("id")
);

-- cotacoes
CREATE TABLE IF NOT EXISTS "cotacoes" (
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
    "arquivos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cotacoes_pkey" PRIMARY KEY ("id")
);

-- cotacao_itens
CREATE TABLE IF NOT EXISTS "cotacao_itens" (
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
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cotacao_itens_pkey" PRIMARY KEY ("id")
);

-- contas_pagamento
CREATE TABLE IF NOT EXISTS "contas_pagamento" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "banco" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "tipo_conta" TEXT,
    "titular" TEXT,
    "documento" TEXT,
    "chave_pix" TEXT,
    "tipo_chave_pix" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contas_pagamento_pkey" PRIMARY KEY ("id")
);

-- invoices
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "os_id" TEXT,
    "cotacao_id" TEXT,
    "cliente_nome" TEXT NOT NULL,
    "cliente_email" TEXT,
    "cliente_telefone" TEXT,
    "cliente_documento" TEXT,
    "cliente_endereco" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data_emissao" DATE NOT NULL,
    "data_vencimento" DATE,
    "status" "StatusInvoice" NOT NULL DEFAULT 'rascunho',
    "valor_total" DECIMAL(12,2) NOT NULL,
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "conta_pagamento_id" TEXT,
    "itens_incluidos" JSONB NOT NULL DEFAULT '[]',
    "observacoes" TEXT,
    "termos_condicoes" TEXT,
    "pdf_url" TEXT,
    "pdf_key" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- Tabela de relação many-to-many OSExtensao <-> Participante
CREATE TABLE IF NOT EXISTS "_OSExtensaoToParticipante" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- ========================
-- ÍNDICES (IF NOT EXISTS)
-- ========================

CREATE INDEX IF NOT EXISTS "os_deleted_at_idx" ON "os"("deleted_at");
CREATE INDEX IF NOT EXISTS "usuarios_supervisor_id_idx" ON "usuarios"("supervisor_id");
CREATE INDEX IF NOT EXISTS "usuarios_departamento_idx" ON "usuarios"("departamento");
CREATE INDEX IF NOT EXISTS "fornecedor_tarifas_vigencia_inicio_idx" ON "fornecedor_tarifas"("vigencia_inicio");
CREATE INDEX IF NOT EXISTS "fornecedor_tarifas_vigencia_fim_idx" ON "fornecedor_tarifas"("vigencia_fim");
CREATE INDEX IF NOT EXISTS "os_extensoes_os_id_idx" ON "os_extensoes"("os_id");
CREATE INDEX IF NOT EXISTS "os_extensoes_data_inicio_idx" ON "os_extensoes"("data_inicio");
CREATE INDEX IF NOT EXISTS "os_atividades_tipo_idx" ON "os_atividades"("tipo");
CREATE INDEX IF NOT EXISTS "os_atividades_os_id_tipo_idx" ON "os_atividades"("os_id", "tipo");
CREATE INDEX IF NOT EXISTS "os_hospedagens_tarifa_id_idx" ON "os_hospedagens"("tarifa_id");
CREATE INDEX IF NOT EXISTS "os_hospedagens_status_pagamento_checkout_idx" ON "os_hospedagens"("status_pagamento", "checkout");
CREATE INDEX IF NOT EXISTS "os_transportes_status_pagamento_data_partida_idx" ON "os_transportes"("status_pagamento", "data_partida");
CREATE INDEX IF NOT EXISTS "financeiro_lancamentos_extensao_id_idx" ON "financeiro_lancamentos"("extensao_id");
CREATE INDEX IF NOT EXISTS "os_pagamentos_extensao_id_idx" ON "os_pagamentos"("extensao_id");
CREATE INDEX IF NOT EXISTS "os_historico_status_extensao_id_idx" ON "os_historico_status"("extensao_id");
CREATE INDEX IF NOT EXISTS "auditoria_os_org_id_idx" ON "auditoria_os"("org_id");
CREATE INDEX IF NOT EXISTS "auditoria_os_os_id_idx" ON "auditoria_os"("os_id");
CREATE INDEX IF NOT EXISTS "auditoria_os_extensao_id_idx" ON "auditoria_os"("extensao_id");
CREATE INDEX IF NOT EXISTS "auditoria_os_usuario_id_idx" ON "auditoria_os"("usuario_id");
CREATE INDEX IF NOT EXISTS "auditoria_os_acao_idx" ON "auditoria_os"("acao");
CREATE INDEX IF NOT EXISTS "auditoria_os_entidade_idx" ON "auditoria_os"("entidade");
CREATE INDEX IF NOT EXISTS "auditoria_os_entidade_id_idx" ON "auditoria_os"("entidade_id");
CREATE INDEX IF NOT EXISTS "auditoria_os_created_at_idx" ON "auditoria_os"("created_at");
CREATE INDEX IF NOT EXISTS "auditoria_os_os_id_created_at_idx" ON "auditoria_os"("os_id", "created_at");
CREATE INDEX IF NOT EXISTS "auditoria_os_os_id_entidade_idx" ON "auditoria_os"("os_id", "entidade");
CREATE INDEX IF NOT EXISTS "organizacao_policies_org_id_idx" ON "organizacao_policies"("org_id");
CREATE INDEX IF NOT EXISTS "organizacao_policies_org_id_ativa_idx" ON "organizacao_policies"("org_id", "ativa");
CREATE INDEX IF NOT EXISTS "organizacao_policies_org_id_versao_idx" ON "organizacao_policies"("org_id", "versao");
CREATE INDEX IF NOT EXISTS "os_policy_snapshots_os_id_idx" ON "os_policy_snapshots"("os_id");
CREATE INDEX IF NOT EXISTS "os_policy_snapshots_policy_id_idx" ON "os_policy_snapshots"("policy_id");
CREATE INDEX IF NOT EXISTS "cotacoes_org_id_idx" ON "cotacoes"("org_id");
CREATE INDEX IF NOT EXISTS "cotacoes_responsavel_id_idx" ON "cotacoes"("responsavel_id");
CREATE INDEX IF NOT EXISTS "cotacoes_status_cotacao_idx" ON "cotacoes"("status_cotacao");
CREATE INDEX IF NOT EXISTS "cotacoes_data_inicio_idx" ON "cotacoes"("data_inicio");
CREATE INDEX IF NOT EXISTS "cotacoes_created_at_idx" ON "cotacoes"("created_at");
CREATE INDEX IF NOT EXISTS "cotacao_itens_cotacao_id_idx" ON "cotacao_itens"("cotacao_id");
CREATE INDEX IF NOT EXISTS "cotacao_itens_fornecedor_id_idx" ON "cotacao_itens"("fornecedor_id");
CREATE INDEX IF NOT EXISTS "cotacao_itens_categoria_idx" ON "cotacao_itens"("categoria");
CREATE INDEX IF NOT EXISTS "contas_pagamento_org_id_idx" ON "contas_pagamento"("org_id");
CREATE INDEX IF NOT EXISTS "contas_pagamento_ativo_idx" ON "contas_pagamento"("ativo");
CREATE INDEX IF NOT EXISTS "contas_pagamento_padrao_idx" ON "contas_pagamento"("padrao");
CREATE INDEX IF NOT EXISTS "invoices_org_id_idx" ON "invoices"("org_id");
CREATE INDEX IF NOT EXISTS "invoices_os_id_idx" ON "invoices"("os_id");
CREATE INDEX IF NOT EXISTS "invoices_cotacao_id_idx" ON "invoices"("cotacao_id");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoices_data_emissao_idx" ON "invoices"("data_emissao");
CREATE INDEX IF NOT EXISTS "invoices_data_vencimento_idx" ON "invoices"("data_vencimento");
CREATE INDEX IF NOT EXISTS "invoices_created_by_idx" ON "invoices"("created_by");
CREATE INDEX IF NOT EXISTS "preset_categories_org_id_idx" ON "preset_categories"("org_id");
CREATE INDEX IF NOT EXISTS "preset_categories_tipo_idx" ON "preset_categories"("tipo");
CREATE INDEX IF NOT EXISTS "preset_categories_parent_id_idx" ON "preset_categories"("parent_id");
CREATE INDEX IF NOT EXISTS "preset_categories_nome_idx" ON "preset_categories"("nome");
CREATE INDEX IF NOT EXISTS "preset_items_org_id_idx" ON "preset_items"("org_id");
CREATE INDEX IF NOT EXISTS "preset_items_categoria_id_idx" ON "preset_items"("categoria_id");
CREATE INDEX IF NOT EXISTS "preset_items_tipo_idx" ON "preset_items"("tipo");
CREATE INDEX IF NOT EXISTS "preset_items_label_idx" ON "preset_items"("label");
CREATE INDEX IF NOT EXISTS "preset_items_uso_count_idx" ON "preset_items"("uso_count");
CREATE INDEX IF NOT EXISTS "preset_items_ultimo_uso_idx" ON "preset_items"("ultimo_uso");
CREATE INDEX IF NOT EXISTS "preset_templates_org_id_idx" ON "preset_templates"("org_id");
CREATE INDEX IF NOT EXISTS "preset_templates_tipo_idx" ON "preset_templates"("tipo");
CREATE INDEX IF NOT EXISTS "preset_templates_nome_idx" ON "preset_templates"("nome");
CREATE INDEX IF NOT EXISTS "preset_templates_uso_count_idx" ON "preset_templates"("uso_count");
CREATE INDEX IF NOT EXISTS "preset_template_items_template_id_idx" ON "preset_template_items"("template_id");
CREATE INDEX IF NOT EXISTS "preset_template_items_item_id_idx" ON "preset_template_items"("item_id");

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_org_id_numero_key" ON "invoices"("org_id", "numero");
CREATE UNIQUE INDEX IF NOT EXISTS "preset_template_items_template_id_item_id_key" ON "preset_template_items"("template_id", "item_id");
CREATE UNIQUE INDEX IF NOT EXISTS "_OSExtensaoToParticipante_AB_unique" ON "_OSExtensaoToParticipante"("A", "B");
CREATE INDEX IF NOT EXISTS "_OSExtensaoToParticipante_B_index" ON "_OSExtensaoToParticipante"("B");

-- ========================
-- FOREIGN KEYS (só adiciona se não existir)
-- ========================

DO $$ BEGIN
  ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_supervisor_id_fkey"
    FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_extensoes" ADD CONSTRAINT "os_extensoes_os_id_fkey"
    FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_fornecedores" ADD CONSTRAINT "os_fornecedores_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_atividades" ADD CONSTRAINT "os_atividades_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_hospedagens" ADD CONSTRAINT "os_hospedagens_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_hospedagens" ADD CONSTRAINT "os_hospedagens_tarifa_id_fkey"
    FOREIGN KEY ("tarifa_id") REFERENCES "fornecedor_tarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_transportes" ADD CONSTRAINT "os_transportes_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_passagens_aereas" ADD CONSTRAINT "os_passagens_aereas_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_guias_designacao" ADD CONSTRAINT "os_guias_designacao_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_motoristas_designacao" ADD CONSTRAINT "os_motoristas_designacao_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_historico_status" ADD CONSTRAINT "os_historico_status_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_os_id_fkey"
    FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_extensao_id_fkey"
    FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "organizacao_policies" ADD CONSTRAINT "organizacao_policies_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_policy_snapshots" ADD CONSTRAINT "os_policy_snapshots_os_id_fkey"
    FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "os_policy_snapshots" ADD CONSTRAINT "os_policy_snapshots_policy_id_fkey"
    FOREIGN KEY ("policy_id") REFERENCES "organizacao_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cotacoes" ADD CONSTRAINT "cotacoes_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cotacoes" ADD CONSTRAINT "cotacoes_responsavel_id_fkey"
    FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cotacao_itens" ADD CONSTRAINT "cotacao_itens_cotacao_id_fkey"
    FOREIGN KEY ("cotacao_id") REFERENCES "cotacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "cotacao_itens" ADD CONSTRAINT "cotacao_itens_fornecedor_id_fkey"
    FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "contas_pagamento" ADD CONSTRAINT "contas_pagamento_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_os_id_fkey"
    FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_conta_pagamento_id_fkey"
    FOREIGN KEY ("conta_pagamento_id") REFERENCES "contas_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cotacao_id_fkey"
    FOREIGN KEY ("cotacao_id") REFERENCES "cotacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "preset_categories" ADD CONSTRAINT "preset_categories_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "preset_categories" ADD CONSTRAINT "preset_categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "preset_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "preset_items" ADD CONSTRAINT "preset_items_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "preset_items" ADD CONSTRAINT "preset_items_categoria_id_fkey"
    FOREIGN KEY ("categoria_id") REFERENCES "preset_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "preset_templates" ADD CONSTRAINT "preset_templates_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "preset_template_items" ADD CONSTRAINT "preset_template_items_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "preset_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "preset_template_items" ADD CONSTRAINT "preset_template_items_item_id_fkey"
    FOREIGN KEY ("item_id") REFERENCES "preset_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "_OSExtensaoToParticipante" ADD CONSTRAINT "_OSExtensaoToParticipante_A_fkey"
    FOREIGN KEY ("A") REFERENCES "os_extensoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "_OSExtensaoToParticipante" ADD CONSTRAINT "_OSExtensaoToParticipante_B_fkey"
    FOREIGN KEY ("B") REFERENCES "os_participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
