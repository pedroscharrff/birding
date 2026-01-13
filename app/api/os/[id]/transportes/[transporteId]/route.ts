import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { logAuditoria } from '@/lib/services/auditoria'
import { z } from 'zod'

const tipoTransporteSchema = z.preprocess(
  (value) => (value === '4x4' ? 'quatro_x_quatro' : value),
  z.enum([
    'van',
    'quatro_x_quatro',
    'executivo_cidade',
    'executivo_fora_cidade',
    'aereo_cliente',
    'aereo_guia',
  ])
)

// Schema de validação para atualização de transporte
const updateTransporteSchema = z.object({
  tipo: tipoTransporteSchema.optional(),
  fornecedorId: z.string().optional().nullable(),
  origem: z.string().optional().nullable(),
  destino: z.string().optional().nullable(),
  dataPartida: z.string().optional().nullable(),
  dataChegada: z.string().optional().nullable(),
  custo: z.number().optional().nullable(),
  moeda: z.enum(['BRL', 'USD', 'EUR']).optional().nullable(),
})

// PATCH /api/os/[id]/transportes/[transporteId] - Atualizar transporte
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; transporteId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, transporteId } = params
    const body = await request.json()

    // Validar entrada
    const validatedData = updateTransporteSchema.parse(body)

    // Verificar se OS existe e pertence à organização
    const os = await prisma.oS.findFirst({
      where: {
        id: osId,
        orgId: session.orgId,
      },
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se transporte existe e pertence à OS (dados antigos)
    const existingTransporte = await prisma.transporte.findFirst({
      where: {
        id: transporteId,
        osId,
      },
    })

    if (!existingTransporte) {
      return NextResponse.json(
        { success: false, error: 'Transporte não encontrado' },
        { status: 404 }
      )
    }

    // Se fornecedor foi especificado, verificar se existe
    if (validatedData.fornecedorId) {
      const fornecedor = await prisma.fornecedor.findFirst({
        where: {
          id: validatedData.fornecedorId,
          orgId: session.orgId,
        },
      })

      if (!fornecedor) {
        return NextResponse.json(
          { success: false, error: 'Fornecedor não encontrado' },
          { status: 404 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (validatedData.tipo !== undefined) updateData.tipo = validatedData.tipo
    if (validatedData.fornecedorId !== undefined) updateData.fornecedorId = validatedData.fornecedorId
    if (validatedData.origem !== undefined) updateData.origem = validatedData.origem
    if (validatedData.destino !== undefined) updateData.destino = validatedData.destino
    if (validatedData.dataPartida !== undefined) {
      if (validatedData.dataPartida) {
        const dt = new Date(validatedData.dataPartida)
        if (Number.isNaN(dt.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Dados inválidos', details: [{ path: ['dataPartida'], message: 'Data inválida' }] },
            { status: 400 }
          )
        }
        updateData.dataPartida = dt
      } else {
        updateData.dataPartida = null
      }
    }
    if (validatedData.dataChegada !== undefined) {
      if (validatedData.dataChegada) {
        const dt = new Date(validatedData.dataChegada)
        if (Number.isNaN(dt.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Dados inválidos', details: [{ path: ['dataChegada'], message: 'Data inválida' }] },
            { status: 400 }
          )
        }
        updateData.dataChegada = dt
      } else {
        updateData.dataChegada = null
      }
    }
    if (validatedData.custo !== undefined) updateData.custo = validatedData.custo
    if (validatedData.moeda !== undefined) updateData.moeda = validatedData.moeda

    // Atualizar transporte
    const transporte = await prisma.transporte.update({
      where: { id: transporteId },
      data: updateData,
      include: {
        fornecedor: {
          select: {
            id: true,
            nomeFantasia: true,
          },
        },
      },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'atualizar',
        entidade: 'transporte',
        entidadeId: transporte.id,
        dadosAntigos: existingTransporte,
        dadosNovos: transporte,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    return NextResponse.json({
      success: true,
      data: transporte,
      message: 'Transporte atualizado com sucesso',
    })
  } catch (error: any) {
    console.error('Update transporte error:', error)

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
      { success: false, error: 'Erro ao atualizar transporte' },
      { status: 500 }
    )
  }
}

// DELETE /api/os/[id]/transportes/[transporteId] - Deletar transporte
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; transporteId: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId, transporteId } = params

    // Verificar se OS existe e pertence à organização
    const os = await prisma.oS.findFirst({
      where: {
        id: osId,
        orgId: session.orgId,
      },
    })

    if (!os) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se transporte existe e pertence à OS (salvar dados antes de deletar)
    const existingTransporte = await prisma.transporte.findFirst({
      where: {
        id: transporteId,
        osId,
      },
    })

    if (!existingTransporte) {
      return NextResponse.json(
        { success: false, error: 'Transporte não encontrado' },
        { status: 404 }
      )
    }

    // Deletar transporte
    await prisma.transporte.delete({
      where: { id: transporteId },
    })

    // Registrar auditoria
    try {
      await logAuditoria({
        osId,
        usuarioId: session.userId,
        acao: 'excluir',
        entidade: 'transporte',
        entidadeId: transporteId,
        dadosAntigos: existingTransporte,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: 'Transporte deletado com sucesso',
    })
  } catch (error: any) {
    console.error('Delete transporte error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao deletar transporte' },
      { status: 500 }
    )
  }
}
