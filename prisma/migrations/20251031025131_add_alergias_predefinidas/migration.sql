-- CreateEnum
CREATE TYPE "Moeda" AS ENUM ('BRL', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('planejamento', 'cotacoes', 'reservas_pendentes', 'reservas_confirmadas', 'documentacao', 'pronto_para_viagem', 'em_andamento', 'concluida', 'pos_viagem', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoTransporte" AS ENUM ('van', '4x4', 'executivo_cidade', 'executivo_fora_cidade', 'aereo_cliente', 'aereo_guia');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('entrada', 'saida', 'adiantamento', 'ajuste');

-- CreateEnum
CREATE TYPE "CategoriaLancamento" AS ENUM ('hospedagem', 'guiamento', 'transporte', 'alimentacao', 'atividade', 'taxa', 'passagem_aerea', 'despesa_guia', 'despesa_motorista', 'outros');

-- CreateEnum
CREATE TYPE "RoleGlobal" AS ENUM ('admin', 'agente', 'guia', 'motorista', 'fornecedor', 'cliente');

-- CreateEnum
CREATE TYPE "TipoFornecedor" AS ENUM ('hotelaria', 'guiamento', 'transporte', 'alimentacao', 'atividade', 'outros');

-- CreateEnum
CREATE TYPE "CategoriaOSFornecedor" AS ENUM ('hotelaria', 'guiamento', 'transporte', 'alimentacao', 'atividade');

-- CreateEnum
CREATE TYPE "RegimeHospedagem" AS ENUM ('sem_cafe', 'cafe', 'meia_pensao', 'pensao_completa');

-- CreateEnum
CREATE TYPE "CategoriaPassagemAerea" AS ENUM ('cliente', 'guia');

-- CreateEnum
CREATE TYPE "TipoEventoCalendario" AS ENUM ('chegada', 'saida', 'atividade', 'transporte', 'checkpoint');

-- CreateEnum
CREATE TYPE "RecursoCalendario" AS ENUM ('guia', 'motorista', 'veiculo', 'fornecedor', 'outros');

-- CreateEnum
CREATE TYPE "PresetTipo" AS ENUM ('alergia', 'restricao', 'preferencia');

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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_pkey" PRIMARY KEY ("id")
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_atividades" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(12,2),
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "localizacao" TEXT,
    "quantidade_maxima" INTEGER,
    "data" DATE,
    "hora" TIME,
    "fornecedor_id" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_hospedagens" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
    "fornecedor_id" TEXT NOT NULL,
    "hotel_nome" TEXT NOT NULL,
    "checkin" TIMESTAMP(3) NOT NULL,
    "checkout" TIMESTAMP(3) NOT NULL,
    "quartos" INTEGER,
    "regime" "RegimeHospedagem",
    "custo_total" DECIMAL(12,2),
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "reservas_refs" JSONB,
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
    "detalhes" JSONB,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "os_passagens_aereas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_guias_designacao" (
    "id" TEXT NOT NULL,
    "os_id" TEXT NOT NULL,
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

    CONSTRAINT "financeiro_lancamentos_pkey" PRIMARY KEY ("id")
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preset_items_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "fornecedores_org_id_idx" ON "fornecedores"("org_id");

-- CreateIndex
CREATE INDEX "fornecedores_tipo_idx" ON "fornecedores"("tipo");

-- CreateIndex
CREATE INDEX "fornecedores_nome_fantasia_idx" ON "fornecedores"("nome_fantasia");

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
CREATE INDEX "os_participantes_os_id_idx" ON "os_participantes"("os_id");

-- CreateIndex
CREATE INDEX "os_participantes_email_idx" ON "os_participantes"("email");

-- CreateIndex
CREATE INDEX "os_participantes_passaporte_numero_idx" ON "os_participantes"("passaporte_numero");

-- CreateIndex
CREATE INDEX "os_fornecedores_os_id_idx" ON "os_fornecedores"("os_id");

-- CreateIndex
CREATE INDEX "os_fornecedores_fornecedor_id_idx" ON "os_fornecedores"("fornecedor_id");

-- CreateIndex
CREATE INDEX "os_fornecedores_categoria_idx" ON "os_fornecedores"("categoria");

-- CreateIndex
CREATE INDEX "os_atividades_os_id_idx" ON "os_atividades"("os_id");

-- CreateIndex
CREATE INDEX "os_atividades_data_idx" ON "os_atividades"("data");

-- CreateIndex
CREATE INDEX "os_atividades_nome_idx" ON "os_atividades"("nome");

-- CreateIndex
CREATE INDEX "os_hospedagens_os_id_idx" ON "os_hospedagens"("os_id");

-- CreateIndex
CREATE INDEX "os_hospedagens_fornecedor_id_idx" ON "os_hospedagens"("fornecedor_id");

-- CreateIndex
CREATE INDEX "os_hospedagens_checkin_idx" ON "os_hospedagens"("checkin");

-- CreateIndex
CREATE INDEX "os_hospedagens_checkout_idx" ON "os_hospedagens"("checkout");

-- CreateIndex
CREATE INDEX "os_transportes_os_id_idx" ON "os_transportes"("os_id");

-- CreateIndex
CREATE INDEX "os_transportes_tipo_idx" ON "os_transportes"("tipo");

-- CreateIndex
CREATE INDEX "os_transportes_data_partida_idx" ON "os_transportes"("data_partida");

-- CreateIndex
CREATE INDEX "os_transportes_data_chegada_idx" ON "os_transportes"("data_chegada");

-- CreateIndex
CREATE INDEX "os_passagens_aereas_os_id_idx" ON "os_passagens_aereas"("os_id");

-- CreateIndex
CREATE INDEX "os_passagens_aereas_categoria_idx" ON "os_passagens_aereas"("categoria");

-- CreateIndex
CREATE INDEX "os_passagens_aereas_data_partida_idx" ON "os_passagens_aereas"("data_partida");

-- CreateIndex
CREATE UNIQUE INDEX "os_guias_designacao_os_id_guia_id_key" ON "os_guias_designacao"("os_id", "guia_id");

-- CreateIndex
CREATE UNIQUE INDEX "os_motoristas_designacao_os_id_motorista_id_key" ON "os_motoristas_designacao"("os_id", "motorista_id");

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
CREATE INDEX "financeiro_lancamentos_categoria_idx" ON "financeiro_lancamentos"("categoria");

-- CreateIndex
CREATE INDEX "financeiro_lancamentos_data_idx" ON "financeiro_lancamentos"("data");

-- CreateIndex
CREATE INDEX "os_anotacoes_os_id_idx" ON "os_anotacoes"("os_id");

-- CreateIndex
CREATE INDEX "os_anotacoes_autor_id_idx" ON "os_anotacoes"("autor_id");

-- CreateIndex
CREATE INDEX "os_anotacoes_created_at_idx" ON "os_anotacoes"("created_at");

-- CreateIndex
CREATE INDEX "os_historico_status_os_id_idx" ON "os_historico_status"("os_id");

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

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os" ADD CONSTRAINT "os_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os" ADD CONSTRAINT "os_agente_responsavel_id_fkey" FOREIGN KEY ("agente_responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_participantes" ADD CONSTRAINT "os_participantes_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_fornecedores" ADD CONSTRAINT "os_fornecedores_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_fornecedores" ADD CONSTRAINT "os_fornecedores_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_atividades" ADD CONSTRAINT "os_atividades_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_atividades" ADD CONSTRAINT "os_atividades_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_hospedagens" ADD CONSTRAINT "os_hospedagens_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_hospedagens" ADD CONSTRAINT "os_hospedagens_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_transportes" ADD CONSTRAINT "os_transportes_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_transportes" ADD CONSTRAINT "os_transportes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_passagens_aereas" ADD CONSTRAINT "os_passagens_aereas_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_guias_designacao" ADD CONSTRAINT "os_guias_designacao_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_guias_designacao" ADD CONSTRAINT "os_guias_designacao_guia_id_fkey" FOREIGN KEY ("guia_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_motoristas_designacao" ADD CONSTRAINT "os_motoristas_designacao_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_referencia_usuario_id_fkey" FOREIGN KEY ("referencia_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro_lancamentos" ADD CONSTRAINT "financeiro_lancamentos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_anotacoes" ADD CONSTRAINT "os_anotacoes_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_anotacoes" ADD CONSTRAINT "os_anotacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_historico_status" ADD CONSTRAINT "os_historico_status_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "os"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
