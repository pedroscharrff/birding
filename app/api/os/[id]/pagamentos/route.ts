import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { obterPagamentosOS, atualizarValorRecebidoOS } from '@/lib/services/os-financeiro'
import { logAuditoria } from '@/lib/services/auditoria'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createPagamentoSchema = z.object({
  tipo: z.enum(['entrada', 'saida']),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.number().positive('Valor deve ser positivo'),
  moeda: z.enum(['BRL', 'USD', 'EUR']).default('BRL'),
  dataVencimento: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data de vencimento inválida'
  }),
  dataPagamento: z.string().optional().nullable(),
  status: z.enum(['pendente', 'parcial', 'pago', 'atrasado', 'cancelado']).default('pendente'),
  percentualParcial: z.number().min(0).max(100).optional().nullable(),
  formaPagamento: z.string().optional().nullable(),
  referencia: z.string().optional().nullable(),
  comprovanteUrl: z.string().optional().nullable(),
  fornecedorId: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

/**
 * GET /api/os/[id]/pagamentos - Listar todos os pagamentos de uma OS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const osId = params.id

    // Verificar se a OS existe e pertence à organização
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

    // Obter resumo de pagamentos
    const resumo = await obterPagamentosOS(osId)

    return NextResponse.json({
      success: true,
      data: resumo
    })
  } catch (error: any) {
    console.error('[OS Pagamentos] Erro ao listar:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao listar pagamentos' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/os/[id]/pagamentos - Criar novo pagamento (parcela)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const osId = params.id
    const body = await request.json()

    // Validar entrada
    const validatedData = createPagamentoSchema.parse(body)

    // Verificar se a OS existe e pertence à organização
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

    // Verificar se fornecedor existe (se for pagamento de saída)
    if (validatedData.fornecedorId) {
      const fornecedor = await prisma.fornecedor.findFirst({
        where: {
          id: validatedData.fornecedorId,
          orgId: session.orgId
        }
      })

      if (!fornecedor) {
        return NextResponse.json(
          { success: false, error: 'Fornecedor não encontrado' },
          { status: 404 }
        )
      }
    }

    // Criar pagamento
    const pagamento = await prisma.pagamentoOS.create({
      data: {
        orgId: session.orgId,
        osId,
        tipo: validatedData.tipo,
        descricao: validatedData.descricao,
        valor: new Decimal(validatedData.valor),
        moeda: validatedData.moeda,
        dataVencimento: new Date(validatedData.dataVencimento),
        dataPagamento: validatedData.dataPagamento ? new Date(validatedData.dataPagamento) : null,
        status: validatedData.status,
        percentualParcial: validatedData.percentualParcial !== undefined && validatedData.percentualParcial !== null
          ? new Decimal(validatedData.percentualParcial)
          : null,
        formaPagamento: validatedData.formaPagamento,
        referencia: validatedData.referencia,
        comprovanteUrl: validatedData.comprovanteUrl,
        fornecedorId: validatedData.fornecedorId,
        observacoes: validatedData.observacoes,
      },
      include: {
        fornecedor: {
          select: {
            id: true,
            nomeFantasia: true
          }
        }
      }
    })

    // Se for entrada e estiver pago, atualizar valor recebido na OS
    if (validatedData.tipo === 'entrada' && validatedData.status === 'pago') {
      await atualizarValorRecebidoOS(osId)
    }

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'criar',
        entidade: 'pagamento_os',
        entidadeId: pagamento.id,
        dadosNovos: pagamento,
        descricao: `Pagamento criado: ${validatedData.descricao}`,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    return NextResponse.json(
      {
        success: true,
        data: pagamento,
        message: 'Pagamento criado com sucesso'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[OS Pagamentos] Erro ao criar:', error)

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
      { success: false, error: 'Erro ao criar pagamento' },
      { status: 500 }
    )
  }
}
