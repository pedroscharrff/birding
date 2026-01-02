import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { atualizarValorRecebidoOS } from '@/lib/services/os-financeiro'
import { logAuditoria } from '@/lib/services/auditoria'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updatePagamentoSchema = z.object({
  descricao: z.string().optional(),
  valor: z.number().positive().optional(),
  moeda: z.enum(['BRL', 'USD', 'EUR']).optional(),
  dataVencimento: z.string().optional(),
  dataPagamento: z.string().optional().nullable(),
  status: z.enum(['pendente', 'parcial', 'pago', 'atrasado', 'cancelado']).optional(),
  formaPagamento: z.string().optional().nullable(),
  referencia: z.string().optional().nullable(),
  comprovanteUrl: z.string().optional().nullable(),
  fornecedorId: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

/**
 * PUT /api/os/[id]/pagamentos/[pagamentoId] - Atualizar um pagamento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; pagamentoId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, pagamentoId } = params
    const body = await request.json()

    // Validar entrada
    const validatedData = updatePagamentoSchema.parse(body)

    // Verificar se o pagamento existe e pertence à OS
    const pagamentoAtual = await prisma.pagamentoOS.findFirst({
      where: {
        id: pagamentoId,
        osId,
        orgId: session.orgId
      }
    })

    if (!pagamentoAtual) {
      return NextResponse.json(
        { success: false, error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (validatedData.descricao !== undefined) {
      updateData.descricao = validatedData.descricao
    }
    if (validatedData.valor !== undefined) {
      updateData.valor = new Decimal(validatedData.valor)
    }
    if (validatedData.moeda !== undefined) {
      updateData.moeda = validatedData.moeda
    }
    if (validatedData.dataVencimento !== undefined) {
      updateData.dataVencimento = new Date(validatedData.dataVencimento)
    }
    if (validatedData.dataPagamento !== undefined) {
      updateData.dataPagamento = validatedData.dataPagamento
        ? new Date(validatedData.dataPagamento)
        : null
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }
    if (validatedData.formaPagamento !== undefined) {
      updateData.formaPagamento = validatedData.formaPagamento
    }
    if (validatedData.referencia !== undefined) {
      updateData.referencia = validatedData.referencia
    }
    if (validatedData.comprovanteUrl !== undefined) {
      updateData.comprovanteUrl = validatedData.comprovanteUrl
    }
    if (validatedData.fornecedorId !== undefined) {
      updateData.fornecedorId = validatedData.fornecedorId
    }
    if (validatedData.observacoes !== undefined) {
      updateData.observacoes = validatedData.observacoes
    }

    // Atualizar pagamento
    const pagamento = await prisma.pagamentoOS.update({
      where: { id: pagamentoId },
      data: updateData,
      include: {
        fornecedor: {
          select: {
            id: true,
            nomeFantasia: true
          }
        }
      }
    })

    // Se for entrada, atualizar valor recebido na OS
    if (pagamento.tipo === 'entrada') {
      await atualizarValorRecebidoOS(osId)
    }

    // Registrar auditoria
    try {
      const camposAlterados = Object.keys(updateData)
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'atualizar',
        entidade: 'pagamento_os',
        entidadeId: pagamentoId,
        dadosAntigos: pagamentoAtual,
        dadosNovos: updateData,
        descricao: `Pagamento atualizado: ${pagamento.descricao}`,
        metadata: {
          camposAlterados,
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    return NextResponse.json({
      success: true,
      data: pagamento,
      message: 'Pagamento atualizado com sucesso'
    })
  } catch (error: any) {
    console.error('[OS Pagamentos] Erro ao atualizar:', error)

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

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar pagamento' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/os/[id]/pagamentos/[pagamentoId] - Deletar um pagamento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pagamentoId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, pagamentoId } = params

    // Verificar se o pagamento existe e pertence à OS
    const pagamento = await prisma.pagamentoOS.findFirst({
      where: {
        id: pagamentoId,
        osId,
        orgId: session.orgId
      }
    })

    if (!pagamento) {
      return NextResponse.json(
        { success: false, error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Deletar pagamento
    await prisma.pagamentoOS.delete({
      where: { id: pagamentoId }
    })

    // Se for entrada, atualizar valor recebido na OS
    if (pagamento.tipo === 'entrada') {
      await atualizarValorRecebidoOS(osId)
    }

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'excluir',
        entidade: 'pagamento_os',
        entidadeId: pagamentoId,
        dadosAntigos: pagamento,
        descricao: `Pagamento excluído: ${pagamento.descricao}`,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: 'Pagamento excluído com sucesso'
    })
  } catch (error: any) {
    console.error('[OS Pagamentos] Erro ao deletar:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao deletar pagamento' },
      { status: 500 }
    )
  }
}
