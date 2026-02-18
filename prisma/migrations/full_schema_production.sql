-- CreateEnum
CREATE TYPE "Moeda" AS ENUM ('BRL', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('planejamento', 'cotacoes', 'reservas_pendentes', 'reservas_confirmadas', 'documentacao', 'pronto_para_viagem', 'em_andamento', 'concluida', 'pos_viagem', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoTransporte" AS ENUM ('van', '4x4', 'executivo_cidade', 'executivo_fora_cidade', 'aereo_cliente', 'aereo_guia', 'suv');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('entrada', 'saida', 'adiantamento', 'ajuste', 'receita_os', 'comissao');

-- CreateEnum
CREATE TYPE "CategoriaLancamento" AS ENUM ('hospedagem', 'guiamento', 'transporte', 'alimentacao', 'atividade', 'taxa', 'passagem_aerea', 'despesa_guia', 'despesa_motorista', 'receita_tour', 'comissao_agente', 'comissao_guia', 'reembolso', 'cancelamento', 'outros');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('pendente', 'parcial', 'pago', 'atrasado', 'cancelado');

-- CreateEnum
CREATE TYPE "RoleGlobal" AS ENUM ('admin', 'agente', 'guia', 'motorista', 'fornecedor', 'cliente');

-- CreateEnum
CREATE TYPE "TipoFornecedor" AS ENUM ('hotelaria', 'guiamento', 'transporte', 'alimentacao', 'atividade', 'outros');

-- CreateEnum
CREATE TYPE "CategoriaOSFornecedor" AS ENUM ('hotelaria', 'guiamento', 'transporte', 'alimentacao', 'atividade');

-- CreateEnum
CREATE TYPE "TipoAtividade" AS ENUM ('atividade', 'alimentacao');

-- CreateEnum
CREATE TYPE "RegimeHospedagem" AS ENUM ('sem_cafe', 'cafe', 'meia_pensao', 'pensao_completa', 'all_inclusive');

-- CreateEnum
CREATE TYPE "CategoriaPassagemAerea" AS ENUM ('cliente', 'guia');

-- CreateEnum
CREATE TYPE "TipoEventoCalendario" AS ENUM ('chegada', 'saida', 'atividade', 'transporte', 'checkpoint');

-- CreateEnum
CREATE TYPE "RecursoCalendario" AS ENUM ('guia', 'motorista', 'veiculo', 'fornecedor', 'outros');

-- CreateEnum
CREATE TYPE "AcaoAuditoria" AS ENUM ('criar', 'atualizar', 'excluir', 'visualizar', 'exportar', 'status_alterado');

-- CreateEnum
CREATE TYPE "EntidadeAuditoria" AS ENUM ('os', 'participante', 'fornecedor_os', 'atividade', 'hospedagem', 'transporte', 'passagem_aerea', 'guia_designacao', 'motorista_designacao', 'scouting', 'lancamento_financeiro', 'pagamento_os', 'anotacao', 'extensao');

-- CreateEnum
CREATE TYPE "PresetTipo" AS ENUM ('alergia', 'restricao', 'preferencia');

-- CreateEnum
CREATE TYPE "StatusCotacao" AS ENUM ('rascunho', 'enviada', 'aceita', 'perdida', 'expirada');

-- CreateEnum
CREATE TYPE "CategoriaCotacaoItem" AS ENUM ('hospedagem', 'atividade', 'transporte', 'alimentacao');

-- CreateEnum
CREATE TYPE "StatusInvoice" AS ENUM ('rascunho', 'enviado', 'pago', 'cancelado', 'vencido');

-- CreateTable
CREATE TABLE "organizacoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "role_global" "RoleGlobal" NOT NULL,
    "hash_senha" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "permissoes" JSONB,
    "departamento" TEXT,
    "cargo" TEXT,
    "supervisor_id" TEXT,
    "avatar" TEXT,
    "ultimo_acesso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome_fantasia" TEXT NOT NULL,
    "razao_social" TEXT,
    "tipo" "TipoFornecedor" NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "documento" TEXT,
    "endereco" JSONB,
    "obs" TEXT,
    "arquivos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedor_tarifas" (
    "id" TEXT NOT NULL,
    "fornecedor_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "unidade" TEXT,
    "vigencia_inicio" DATE,
    "vigencia_fim" DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "tipo_quarto" TEXT,
    "regime" TEXT,
    "quartos" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedor_tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "status" "StatusOS" NOT NULL DEFAULT 'planejamento',
    "agente_responsavel_id" TEXT NOT NULL,
    "descricao" TEXT,
    "checklist" JSONB,
    "valor_venda" DECIMAL(12,2),
    "moeda_venda" "Moeda" NOT NULL DEFAULT 'BRL',
    "valor_recebido" DECIMAL(12,2) DEFAULT 0,
    "custo_estimado" DECIMAL(12,2),
    "custo_real" DECIMAL(12,2),
    "margem_estimada" DECIMAL(5,2),
    "obs_financeiras" TEXT,
    "arquivos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "os_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_extensoes" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_extensoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_participantes" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "passaporte_numero" TEXT,
    "passaporte_validade" DATE,
    "alergias" TEXT,
    "restricoes" TEXT,
    "preferencias" TEXT,
    "idade" INTEGER,
    "observacoes" TEXT,
    "documentos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_fornecedores" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "fornecedor_id" TEXT NOT NULL,
    "categoria" "CategoriaOSFornecedor" NOT NULL,
    "contato_nome" TEXT,
    "contato_email" TEXT,
    "contato_telefone" TEXT,
    "contrato_ref" TEXT,
    "extensao_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_atividades" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "tipo" "TipoAtividade" NOT NULL DEFAULT 'atividade',
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(12,2),
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "localizacao" TEXT,
    "quantidade_maxima" INTEGER,
    "data" DATE,
    "hora" TIME,
    "fornecedor_id" TEXT,
    "notas" TEXT,
    "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "data_pagamento" DATE,
    "forma_pagamento" TEXT,
    "referencia_pagamento" TEXT,
    "extensao_id" TEXT,
    "arquivos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_hospedagens" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "fornecedor_id" TEXT NOT NULL,
    "tarifa_id" TEXT,
    "hotel_nome" TEXT NOT NULL,
    "checkin" TIMESTAMP(3) NOT NULL,
    "checkout" TIMESTAMP(3) NOT NULL,
    "quartos" INTEGER,
    "tipo_quarto" TEXT,
    "regime" "RegimeHospedagem",
    "custo_total" DECIMAL(12,2),
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "observacoes" TEXT,
    "reservas_refs" JSONB,
    "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "data_pagamento" DATE,
    "forma_pagamento" TEXT,
    "referencia_pagamento" TEXT,
    "extensao_id" TEXT,
    "arquivos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_hospedagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_transportes" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "tipo" "TipoTransporte" NOT NULL,
    "fornecedor_id" TEXT,
    "origem" TEXT,
    "destino" TEXT,
    "data_partida" TIMESTAMP(3),
    "data_chegada" TIMESTAMP(3),
    "custo" DECIMAL(12,2),
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "extensao_id" TEXT,
    "detalhes" JSONB,
    "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "data_pagamento" DATE,
    "forma_pagamento" TEXT,
    "referencia_pagamento" TEXT,
    "arquivos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_transportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_passagens_aereas" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "categoria" "CategoriaPassagemAerea" NOT NULL,
    "passageiro_nome" TEXT NOT NULL,
    "cia" TEXT,
    "pnr" TEXT,
    "trecho" TEXT,
    "data_partida" TIMESTAMP(3),
    "data_chegada" TIMESTAMP(3),
    "custo" DECIMAL(12,2),
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "extensao_id" TEXT,
    "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "data_pagamento" DATE,
    "forma_pagamento" TEXT,
    "referencia_pagamento" TEXT,
    "arquivos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_passagens_aereas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_guias_designacao" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "extensao_id" TEXT,
    "guia_id" TEXT NOT NULL,
    "funcao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_guias_designacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_motoristas_designacao" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "motorista_id" TEXT NOT NULL,
    "extensao_id" TEXT,
    "veiculo_tipo" "TipoTransporte",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_motoristas_designacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_scoutings" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "roteiro_json" JSONB,
    "anexos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_scoutings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro_lancamentos" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "os_id" TEXT,
    "referencia_usuario_id" TEXT,
    "fornecedor_id" TEXT,
    "tipo" "TipoLancamento" NOT NULL,
    "categoria" "CategoriaLancamento" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "data" DATE NOT NULL,
    "observacao" TEXT,
    "comprovante_url" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "extensao_id" TEXT,

    CONSTRAINT "financeiro_lancamentos_pkey" PRIMARY KEY ("id")
);

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
    "percentual_parcial" DECIMAL(5,2),
    "forma_pagamento" TEXT,
    "referencia" TEXT,
    "comprovante_url" TEXT,
    "fornecedor_id" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "extensao_id" TEXT,

    CONSTRAINT "os_pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_anotacoes" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "os_anotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_historico_status" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "de" "StatusOS",
    "para" "StatusOS" NOT NULL,
    "alterado_por" TEXT NOT NULL,
    "motivo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extensao_id" TEXT,

    CONSTRAINT "os_historico_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendario_eventos" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoEventoCalendario" NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "recurso" "RecursoCalendario",
    "recurso_ref_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendario_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset_categories" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "PresetTipo" NOT NULL,
    "parent_id" TEXT,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset_items" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preset_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset_templates" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "PresetTipo" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "uso_count" INTEGER NOT NULL DEFAULT 0,
    "ultimo_uso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preset_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset_template_items" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "ordem" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preset_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_os" (
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
    "arquivos" JSONB,
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

-- CreateTable
CREATE TABLE "contas_pagamento" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
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
    "itens_incluidos" JSONB NOT NULL,
    "observacoes" TEXT,
    "termos_condicoes" TEXT,
    "pdf_url" TEXT,
    "pdf_key" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OSExtensaoToParticipante" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "organizacoes_nome_idx" ON "organizacoes"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_org_id_idx" ON "usuarios"("org_id");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_role_global_idx" ON "usuarios"("role_global");

-- CreateIndex
CREATE INDEX "usuarios_ativo_idx" ON "usuarios"("ativo");

-- CreateIndex
CREATE INDEX "usuarios_supervisor_id_idx" ON "usuarios"("supervisor_id");

-- CreateIndex
CREATE INDEX "usuarios_departamento_idx" ON "usuarios"("departamento");

-- CreateIndex
CREATE INDEX "fornecedores_org_id_idx" ON "fornecedores"("org_id");

-- CreateIndex
CREATE INDEX "fornecedores_tipo_idx" ON "fornecedores"("tipo");

-- CreateIndex
CREATE INDEX "fornecedores_nome_fantasia_idx" ON "fornecedores"("nome_fantasia");

-- CreateIndex
CREATE INDEX "fornecedor_tarifas_fornecedor_id_idx" ON "fornecedor_tarifas"("fornecedor_id");

-- CreateIndex
CREATE INDEX "fornecedor_tarifas_ativo_idx" ON "fornecedor_tarifas"("ativo");

-- CreateIndex
CREATE INDEX "fornecedor_tarifas_vigencia_inicio_idx" ON "fornecedor_tarifas"("vigencia_inicio");

-- CreateIndex
CREATE INDEX "fornecedor_tarifas_vigencia_fim_idx" ON "fornecedor_tarifas"("vigencia_fim");

-- CreateIndex
CREATE INDEX "os_org_id_idx" ON "os"("org_id");

-- CreateIndex
CREATE INDEX "os_status_idx" ON "os"("status");

-- CreateIndex
CREATE INDEX "os_data_inicio_idx" ON "os"("data_inicio");

-- CreateIndex
CREATE INDEX "os_data_fim_idx" ON "os"("data_fim");

-- CreateIndex
CREATE INDEX "os_destino_idx" ON "os"("destino");

-- CreateIndex
CREATE INDEX "os_agente_responsavel_id_idx" ON "os"("agente_responsavel_id");

-- CreateIndex
CREATE INDEX "os_deleted_at_idx" ON "os"("deleted_at");

-- CreateIndex
CREATE INDEX "os_extensoes_os_id_idx" ON "os_extensoes"("os_id");

-- CreateIndex
CREATE INDEX "os_extensoes_data_inicio_idx" ON "os_extensoes"("data_inicio");

-- CreateIndex
CREATE INDEX "os_participantes_os_id_idx" ON "os_participantes"("os_id");

-- CreateIndex
CREATE INDEX "os_participantes_email_idx" ON "os_participantes"("email");

-- CreateIndex
CREATE INDEX "os_participantes_passaporte_numero_idx" ON "os_participantes"("passaporte_numero");

-- CreateIndex
CREATE INDEX "os_fornecedores_os_id_idx" ON "os_fornecedores"("os_id");

-- CreateIndex
CREATE INDEX "os_fornecedores_extensao_id_idx" ON "os_fornecedores"("extensao_id");

-- CreateIndex
CREATE INDEX "os_fornecedores_fornecedor_id_idx" ON "os_fornecedores"("fornecedor_id");

-- CreateIndex
CREATE INDEX "os_fornecedores_categoria_idx" ON "os_fornecedores"("categoria");

-- CreateIndex
CREATE INDEX "os_atividades_os_id_idx" ON "os_atividades"("os_id");

-- CreateIndex
CREATE INDEX "os_atividades_tipo_idx" ON "os_atividades"("tipo");

-- CreateIndex
CREATE INDEX "os_atividades_data_idx" ON "os_atividades"("data");

-- CreateIndex
CREATE INDEX "os_atividades_nome_idx" ON "os_atividades"("nome");

-- CreateIndex
CREATE INDEX "os_atividades_status_pagamento_idx" ON "os_atividades"("status_pagamento");

-- CreateIndex
CREATE INDEX "os_atividades_status_pagamento_data_idx" ON "os_atividades"("status_pagamento", "data");

-- CreateIndex
CREATE INDEX "os_atividades_os_id_tipo_idx" ON "os_atividades"("os_id", "tipo");

-- CreateIndex
CREATE INDEX "os_hospedagens_os_id_idx" ON "os_hospedagens"("os_id");

-- CreateIndex
CREATE INDEX "os_hospedagens_fornecedor_id_idx" ON "os_hospedagens"("fornecedor_id");

-- CreateIndex
CREATE INDEX "os_hospedagens_tarifa_id_idx" ON "os_hospedagens"("tarifa_id");

-- CreateIndex
CREATE INDEX "os_hospedagens_checkin_idx" ON "os_hospedagens"("checkin");

-- CreateIndex
CREATE INDEX "os_hospedagens_checkout_idx" ON "os_hospedagens"("checkout");

-- CreateIndex
CREATE INDEX "os_hospedagens_status_pagamento_idx" ON "os_hospedagens"("status_pagamento");

-- CreateIndex
CREATE INDEX "os_hospedagens_status_pagamento_checkout_idx" ON "os_hospedagens"("status_pagamento", "checkout");

-- CreateIndex
CREATE INDEX "os_transportes_os_id_idx" ON "os_transportes"("os_id");

-- CreateIndex
CREATE INDEX "os_transportes_tipo_idx" ON "os_transportes"("tipo");

-- CreateIndex
CREATE INDEX "os_transportes_data_partida_idx" ON "os_transportes"("data_partida");

-- CreateIndex
CREATE INDEX "os_transportes_data_chegada_idx" ON "os_transportes"("data_chegada");

-- CreateIndex
CREATE INDEX "os_transportes_status_pagamento_idx" ON "os_transportes"("status_pagamento");

-- CreateIndex
CREATE INDEX "os_transportes_status_pagamento_data_partida_idx" ON "os_transportes"("status_pagamento", "data_partida");

-- CreateIndex
CREATE INDEX "os_passagens_aereas_os_id_idx" ON "os_passagens_aereas"("os_id");

-- CreateIndex
CREATE INDEX "os_passagens_aereas_categoria_idx" ON "os_passagens_aereas"("categoria");

-- CreateIndex
CREATE INDEX "os_passagens_aereas_data_partida_idx" ON "os_passagens_aereas"("data_partida");

-- CreateIndex
CREATE INDEX "os_passagens_aereas_status_pagamento_idx" ON "os_passagens_aereas"("status_pagamento");

-- CreateIndex
CREATE UNIQUE INDEX "os_guias_designacao_os_id_guia_id_extensao_id_key" ON "os_guias_designacao"("os_id", "guia_id", "extensao_id");

-- CreateIndex
CREATE UNIQUE INDEX "os_motoristas_designacao_os_id_motorista_id_extensao_id_key" ON "os_motoristas_designacao"("os_id", "motorista_id", "extensao_id");

-- CreateIndex
CREATE INDEX "os_scoutings_os_id_idx" ON "os_scoutings"("os_id");

-- CreateIndex
CREATE INDEX "os_scoutings_autor_id_idx" ON "os_scoutings"("autor_id");

-- CreateIndex
CREATE INDEX "os_scoutings_created_at_idx" ON "os_scoutings"("created_at");

-- CreateIndex
CREATE INDEX "financeiro_lancamentos_org_id_idx" ON "financeiro_lancamentos"("org_id");

-- CreateIndex
CREATE INDEX "financeiro_lancamentos_os_id_idx" ON "financeiro_lancamentos"("os_id");

-- CreateIndex
CREATE INDEX "financeiro_lancamentos_extensao_id_idx" ON "financeiro_lancamentos"("extensao_id");

-- CreateIndex
CREATE INDEX "financeiro_lancamentos_categoria_idx" ON "financeiro_lancamentos"("categoria");

-- CreateIndex
CREATE INDEX "financeiro_lancamentos_data_idx" ON "financeiro_lancamentos"("data");

-- CreateIndex
CREATE INDEX "os_pagamentos_org_id_idx" ON "os_pagamentos"("org_id");

-- CreateIndex
CREATE INDEX "os_pagamentos_os_id_idx" ON "os_pagamentos"("os_id");

-- CreateIndex
CREATE INDEX "os_pagamentos_extensao_id_idx" ON "os_pagamentos"("extensao_id");

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
CREATE INDEX "os_anotacoes_os_id_idx" ON "os_anotacoes"("os_id");

-- CreateIndex
CREATE INDEX "os_anotacoes_autor_id_idx" ON "os_anotacoes"("autor_id");

-- CreateIndex
CREATE INDEX "os_anotacoes_created_at_idx" ON "os_anotacoes"("created_at");

-- CreateIndex
CREATE INDEX "os_historico_status_os_id_idx" ON "os_historico_status"("os_id");

-- CreateIndex
CREATE INDEX "os_historico_status_extensao_id_idx" ON "os_historico_status"("extensao_id");

-- CreateIndex
CREATE INDEX "os_historico_status_created_at_idx" ON "os_historico_status"("created_at");

-- CreateIndex
CREATE INDEX "calendario_eventos_org_id_idx" ON "calendario_eventos"("org_id");

-- CreateIndex
CREATE INDEX "calendario_eventos_os_id_idx" ON "calendario_eventos"("os_id");

-- CreateIndex
CREATE INDEX "calendario_eventos_inicio_idx" ON "calendario_eventos"("inicio");

-- CreateIndex
CREATE INDEX "calendario_eventos_tipo_idx" ON "calendario_eventos"("tipo");

-- CreateIndex
CREATE INDEX "preset_categories_org_id_idx" ON "preset_categories"("org_id");

-- CreateIndex
CREATE INDEX "preset_categories_tipo_idx" ON "preset_categories"("tipo");

-- CreateIndex
CREATE INDEX "preset_categories_parent_id_idx" ON "preset_categories"("parent_id");

-- CreateIndex
CREATE INDEX "preset_categories_nome_idx" ON "preset_categories"("nome");

-- CreateIndex
CREATE INDEX "preset_items_org_id_idx" ON "preset_items"("org_id");

-- CreateIndex
CREATE INDEX "preset_items_categoria_id_idx" ON "preset_items"("categoria_id");

-- CreateIndex
CREATE INDEX "preset_items_tipo_idx" ON "preset_items"("tipo");

-- CreateIndex
CREATE INDEX "preset_items_label_idx" ON "preset_items"("label");

-- CreateIndex
CREATE INDEX "preset_items_uso_count_idx" ON "preset_items"("uso_count");

-- CreateIndex
CREATE INDEX "preset_items_ultimo_uso_idx" ON "preset_items"("ultimo_uso");

-- CreateIndex
CREATE INDEX "preset_templates_org_id_idx" ON "preset_templates"("org_id");

-- CreateIndex
CREATE INDEX "preset_templates_tipo_idx" ON "preset_templates"("tipo");

-- CreateIndex
CREATE INDEX "preset_templates_nome_idx" ON "preset_templates"("nome");

-- CreateIndex
CREATE INDEX "preset_templates_uso_count_idx" ON "preset_templates"("uso_count");

-- CreateIndex
CREATE INDEX "preset_template_items_template_id_idx" ON "preset_template_items"("template_id");

-- CreateIndex
CREATE INDEX "preset_template_items_item_id_idx" ON "preset_template_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "preset_template_items_template_id_item_id_key" ON "preset_template_items"("template_id", "item_id");

-- CreateIndex
CREATE INDEX "auditoria_os_org_id_idx" ON "auditoria_os"("org_id");

-- CreateIndex
CREATE INDEX "auditoria_os_os_id_idx" ON "auditoria_os"("os_id");

-- CreateIndex
CREATE INDEX "auditoria_os_extensao_id_idx" ON "auditoria_os"("extensao_id");

-- CreateIndex
CREATE INDEX "auditoria_os_usuario_id_idx" ON "auditoria_os"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_os_acao_idx" ON "auditoria_os"("acao");

-- CreateIndex
CREATE INDEX "auditoria_os_entidade_idx" ON "auditoria_os"("entidade");

-- CreateIndex
CREATE INDEX "auditoria_os_entidade_id_idx" ON "auditoria_os"("entidade_id");

-- CreateIndex
CREATE INDEX "auditoria_os_created_at_idx" ON "auditoria_os"("created_at");

-- CreateIndex
CREATE INDEX "auditoria_os_os_id_created_at_idx" ON "auditoria_os"("os_id", "created_at");

-- CreateIndex
CREATE INDEX "auditoria_os_os_id_entidade_idx" ON "auditoria_os"("os_id", "entidade");

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
CREATE INDEX "contas_pagamento_org_id_idx" ON "contas_pagamento"("org_id");

-- CreateIndex
CREATE INDEX "contas_pagamento_ativo_idx" ON "contas_pagamento"("ativo");

-- CreateIndex
CREATE INDEX "contas_pagamento_padrao_idx" ON "contas_pagamento"("padrao");

-- CreateIndex
CREATE INDEX "invoices_org_id_idx" ON "invoices"("org_id");

-- CreateIndex
CREATE INDEX "invoices_os_id_idx" ON "invoices"("os_id");

-- CreateIndex
CREATE INDEX "invoices_cotacao_id_idx" ON "invoices"("cotacao_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_data_emissao_idx" ON "invoices"("data_emissao");

-- CreateIndex
CREATE INDEX "invoices_data_vencimento_idx" ON "invoices"("data_vencimento");

-- CreateIndex
CREATE INDEX "invoices_created_by_idx" ON "invoices"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_org_id_numero_key" ON "invoices"("org_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "_OSExtensaoToParticipante_AB_unique" ON "_OSExtensaoToParticipante"("A", "B");

-- CreateIndex
CREATE INDEX "_OSExtensaoToParticipante_B_index" ON "_OSExtensaoToParticipante"("B");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedor_tarifas" ADD CONSTRAINT "fornecedor_tarifas_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os" ADD CONSTRAINT "os_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os" ADD CONSTRAINT "os_agente_responsavel_id_fkey" FOREIGN KEY ("agente_responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_extensoes" ADD CONSTRAINT "os_extensoes_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_participantes" ADD CONSTRAINT "os_participantes_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_fornecedores" ADD CONSTRAINT "os_fornecedores_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_fornecedores" ADD CONSTRAINT "os_fornecedores_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_fornecedores" ADD CONSTRAINT "os_fornecedores_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_atividades" ADD CONSTRAINT "os_atividades_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_atividades" ADD CONSTRAINT "os_atividades_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_atividades" ADD CONSTRAINT "os_atividades_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_hospedagens" ADD CONSTRAINT "os_hospedagens_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_hospedagens" ADD CONSTRAINT "os_hospedagens_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_hospedagens" ADD CONSTRAINT "os_hospedagens_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_hospedagens" ADD CONSTRAINT "os_hospedagens_tarifa_id_fkey" FOREIGN KEY ("tarifa_id") REFERENCES "fornecedor_tarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_transportes" ADD CONSTRAINT "os_transportes_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_transportes" ADD CONSTRAINT "os_transportes_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_transportes" ADD CONSTRAINT "os_transportes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_passagens_aereas" ADD CONSTRAINT "os_passagens_aereas_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_passagens_aereas" ADD CONSTRAINT "os_passagens_aereas_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_guias_designacao" ADD CONSTRAINT "os_guias_designacao_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_guias_designacao" ADD CONSTRAINT "os_guias_designacao_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_guias_designacao" ADD CONSTRAINT "os_guias_designacao_guia_id_fkey" FOREIGN KEY ("guia_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_motoristas_designacao" ADD CONSTRAINT "os_motoristas_designacao_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_motoristas_designacao" ADD CONSTRAINT "os_motoristas_designacao_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_motoristas_designacao" ADD CONSTRAINT "os_motoristas_designacao_motorista_id_fkey" FOREIGN KEY ("motorista_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_scoutings" ADD CONSTRAINT "os_scoutings_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_scoutings" ADD CONSTRAINT "os_scoutings_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_referencia_usuario_id_fkey" FOREIGN KEY ("referencia_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_pagamentos" ADD CONSTRAINT "os_pagamentos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_anotacoes" ADD CONSTRAINT "os_anotacoes_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_anotacoes" ADD CONSTRAINT "os_anotacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_historico_status" ADD CONSTRAINT "os_historico_status_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_historico_status" ADD CONSTRAINT "os_historico_status_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_historico_status" ADD CONSTRAINT "os_historico_status_alterado_por_fkey" FOREIGN KEY ("alterado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_eventos" ADD CONSTRAINT "calendario_eventos_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendario_eventos" ADD CONSTRAINT "calendario_eventos_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_categories" ADD CONSTRAINT "preset_categories_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_categories" ADD CONSTRAINT "preset_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "preset_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_items" ADD CONSTRAINT "preset_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_items" ADD CONSTRAINT "preset_items_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "preset_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_templates" ADD CONSTRAINT "preset_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_template_items" ADD CONSTRAINT "preset_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "preset_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_template_items" ADD CONSTRAINT "preset_template_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "preset_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_extensao_id_fkey" FOREIGN KEY ("extensao_id") REFERENCES "os_extensoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_os" ADD CONSTRAINT "auditoria_os_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "contas_pagamento" ADD CONSTRAINT "contas_pagamento_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_conta_pagamento_id_fkey" FOREIGN KEY ("conta_pagamento_id") REFERENCES "contas_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cotacao_id_fkey" FOREIGN KEY ("cotacao_id") REFERENCES "cotacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OSExtensaoToParticipante" ADD CONSTRAINT "_OSExtensaoToParticipante_A_fkey" FOREIGN KEY ("A") REFERENCES "os_extensoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OSExtensaoToParticipante" ADD CONSTRAINT "_OSExtensaoToParticipante_B_fkey" FOREIGN KEY ("B") REFERENCES "os_participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

