import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { atualizarStatusPagamentoDespesa } from '@/lib/services/despesas'
import { logAuditoria } from '@/lib/services/auditoria'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Schema para arquivo uploadado
const uploadedFileSchema = z.object({
  url: z.string(),
  key: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
})

const updateDespesaSchema = z.object({
  statusPagamento: z.enum(['pendente', 'pago', 'parcial', 'atrasado', 'cancelado']),
  dataPagamento: z.string().optional().nullable(),
  formaPagamento: z.string().optional().nullable(),
  referenciaPagamento: z.string().optional().nullable(),
  comprovantes: z.array(uploadedFileSchema).optional().nullable(),
  arquivos: z.array(uploadedFileSchema).optional().nullable(),
})

/**
 * PATCH /api/os/[id]/despesas/[tipo]/[despesaId] - Atualizar status de pagamento de uma despesa
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; tipo: string; despesaId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, tipo, despesaId } = params
    const body = await request.json()

    // Validar tipo
    if (!['hospedagem', 'transporte', 'atividade', 'passagem_aerea'].includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de despesa inválido' },
        { status: 400 }
      )
    }

    // Validar dados
    const validatedData = updateDespesaSchema.parse(body)

    // Verificar se a OS pertence à organização
    const os = await prisma.oS.findFirst({
      where: {
        id: osId,
        orgId: session.orgId
      }
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Buscar dados anteriores para auditoria
    let dadosAntigos: any = null
    const entidade = tipo as any

    switch (tipo) {
      case 'hospedagem':
        dadosAntigos = await prisma.hospedagem.findUnique({ where: { id: despesaId } })
        break
      case 'transporte':
        dadosAntigos = await prisma.transporte.findUnique({ where: { id: despesaId } })
        break
      case 'atividade':
        dadosAntigos = await prisma.atividade.findUnique({ where: { id: despesaId } })
        break
      case 'passagem_aerea':
        dadosAntigos = await prisma.passagemAerea.findUnique({ where: { id: despesaId } })
        break
    }

    if (!dadosAntigos || dadosAntigos.osId !== osId) {
      return NextResponse.json(
        { success: false, error: 'Despesa não encontrada' },
        { status: 404 }
      )
    }

    const arquivos = validatedData.arquivos ?? validatedData.comprovantes

    if (validatedData.dataPagamento) {
      const dt = new Date(validatedData.dataPagamento)
      if (Number.isNaN(dt.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Dados inválidos', details: [{ path: ['dataPagamento'], message: 'Data inválida' }] },
          { status: 400 }
        )
      }
    }

    // Atualizar despesa
    const despesaAtualizada = await atualizarStatusPagamentoDespesa(
      tipo as any,
      despesaId,
      {
        statusPagamento: validatedData.statusPagamento,
        dataPagamento: validatedData.dataPagamento ? new Date(validatedData.dataPagamento) : null,
        formaPagamento: validatedData.formaPagamento,
        referenciaPagamento: validatedData.referenciaPagamento,
        arquivos,
      }
    )

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'atualizar',
        entidade,
        entidadeId: despesaId,
        dadosAntigos: {
          statusPagamento: dadosAntigos.statusPagamento,
          dataPagamento: dadosAntigos.dataPagamento,
          formaPagamento: dadosAntigos.formaPagamento,
          referenciaPagamento: dadosAntigos.referenciaPagamento,
        },
        dadosNovos: validatedData,
        descricao: `Status de pagamento atualizado para: ${validatedData.statusPagamento}`,
        metadata: {
          tipo,
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    return NextResponse.json({
      success: true,
      data: despesaAtualizada,
      message: 'Status de pagamento atualizado com sucesso'
    })
  } catch (error: any) {
    console.error('[OS Despesas] Erro ao atualizar:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { success: false, error: 'Despesa não encontrada' },
          { status: 404 }
        )
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'Dados inválidos' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar despesa' },
      { status: 500 }
    )
  }
}
