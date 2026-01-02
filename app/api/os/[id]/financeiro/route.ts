import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import {
  obterResumoFinanceiroOS,
  calcularMargemOS,
  atualizarCustoRealOS
} from '@/lib/services/os-financeiro'
import { logAuditoria } from '@/lib/services/auditoria'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateFinanceiroSchema = z.object({
  valorVenda: z.number().optional(),
  moedaVenda: z.enum(['BRL', 'USD', 'EUR']).optional(),
  custoEstimado: z.number().optional(),
  margemEstimada: z.number().optional(),
  obsFinanceiras: z.string().optional().nullable(),
})

/**
 * GET /api/os/[id]/financeiro - Obter resumo financeiro da OS
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

    // Obter resumo financeiro
    const resumo = await obterResumoFinanceiroOS(osId)
    const detalhes = await calcularMargemOS(osId)

    return NextResponse.json({
      success: true,
      data: {
        resumo,
        detalhes: {
          custos: detalhes.custosDetalhados,
          margem: {
            estimada: {
              valor: detalhes.lucroEstimado,
              percentual: detalhes.margemEstimadaPercent
            },
            real: {
              valor: detalhes.lucroReal,
              percentual: detalhes.margemRealPercent
            }
          }
        },
        os: {
          valorVenda: os.valorVenda ? Number(os.valorVenda) : null,
          moedaVenda: os.moedaVenda,
          valorRecebido: os.valorRecebido ? Number(os.valorRecebido) : 0,
          custoEstimado: os.custoEstimado ? Number(os.custoEstimado) : null,
          custoReal: os.custoReal ? Number(os.custoReal) : null,
          margemEstimada: os.margemEstimada ? Number(os.margemEstimada) : null,
          obsFinanceiras: os.obsFinanceiras
        }
      }
    })
  } catch (error: any) {
    console.error('[OS Financeiro] Erro ao obter resumo:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao obter resumo financeiro' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/os/[id]/financeiro - Atualizar informações financeiras da OS
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const osId = params.id
    const body = await request.json()

    // Validar entrada
    const validatedData = updateFinanceiroSchema.parse(body)

    // Verificar se a OS existe e pertence à organização
    const osAtual = await prisma.oS.findFirst({
      where: {
        id: osId,
        orgId: session.orgId
      }
    })

    if (!osAtual) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (validatedData.valorVenda !== undefined) {
      updateData.valorVenda = new Decimal(validatedData.valorVenda)
    }
    if (validatedData.moedaVenda !== undefined) {
      updateData.moedaVenda = validatedData.moedaVenda
    }
    if (validatedData.custoEstimado !== undefined) {
      updateData.custoEstimado = new Decimal(validatedData.custoEstimado)
    }
    if (validatedData.margemEstimada !== undefined) {
      updateData.margemEstimada = new Decimal(validatedData.margemEstimada)
    }
    if (validatedData.obsFinanceiras !== undefined) {
      updateData.obsFinanceiras = validatedData.obsFinanceiras
    }

    // Atualizar OS
    const osAtualizada = await prisma.oS.update({
      where: { id: osId },
      data: updateData
    })

    // Atualizar custo real automaticamente
    await atualizarCustoRealOS(osId)

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'atualizar',
        entidade: 'os',
        entidadeId: osId,
        dadosAntigos: {
          valorVenda: osAtual.valorVenda,
          custoEstimado: osAtual.custoEstimado,
          margemEstimada: osAtual.margemEstimada,
          obsFinanceiras: osAtual.obsFinanceiras
        },
        dadosNovos: updateData,
        descricao: 'Atualização de informações financeiras da OS',
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // Obter resumo atualizado
    const resumo = await obterResumoFinanceiroOS(osId)

    return NextResponse.json({
      success: true,
      data: resumo,
      message: 'Informações financeiras atualizadas com sucesso'
    })
  } catch (error: any) {
    console.error('[OS Financeiro] Erro ao atualizar:', error)

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
      { success: false, error: 'Erro ao atualizar informações financeiras' },
      { status: 500 }
    )
  }
}
