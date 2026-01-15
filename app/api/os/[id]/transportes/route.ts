import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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

const createTransporteSchema = z.object({
  tipo: tipoTransporteSchema,
  fornecedorId: z.string().optional().nullable(),
  origem: z.string().optional().nullable(),
  destino: z.string().optional().nullable(),
  dataPartida: z.string().optional().nullable(),
  dataChegada: z.string().optional().nullable(),
  custo: z
    .preprocess(
      (value) => {
        if (value === undefined || value === null || value === '') return null
        if (typeof value === 'number') return value
        const n = Number(value)
        return Number.isNaN(n) ? value : n
      },
      z.number().nonnegative().nullable().optional()
    )
    .optional(),
  moeda: z.enum(['BRL', 'USD', 'EUR']).optional().nullable(),
})

// POST /api/os/[id]/transportes - Adicionar transporte
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const osId = params.id

    const validatedData = createTransporteSchema.parse(body)

    if (validatedData.dataPartida) {
      const dt = new Date(validatedData.dataPartida)
      if (Number.isNaN(dt.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Dados inválidos', details: [{ path: ['dataPartida'], message: 'Data inválida' }] },
          { status: 400 }
        )
      }
    }
    if (validatedData.dataChegada) {
      const dt = new Date(validatedData.dataChegada)
      if (Number.isNaN(dt.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Dados inválidos', details: [{ path: ['dataChegada'], message: 'Data inválida' }] },
          { status: 400 }
        )
      }
    }

    // Verificar se a OS existe e pertence à organização
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

    const transporte = await prisma.transporte.create({
      data: {
        osId,
        tipo: validatedData.tipo,
        fornecedorId: validatedData.fornecedorId || null,
        origem: validatedData.origem || null,
        destino: validatedData.destino || null,
        dataPartida: validatedData.dataPartida ? new Date(validatedData.dataPartida) : null,
        dataChegada: validatedData.dataChegada ? new Date(validatedData.dataChegada) : null,
        custo: validatedData.custo === undefined ? null : validatedData.custo,
        moeda: validatedData.moeda || 'BRL',
      },
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
        acao: 'criar',
        entidade: 'transporte',
        entidadeId: transporte.id,
        dadosNovos: transporte,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // Revalidar cache para atualizar a lista de transportes
    revalidatePath(`/dashboard/os/${osId}`)
    revalidatePath('/dashboard/os')

    return NextResponse.json({
      success: true,
      data: transporte,
    })
  } catch (error: any) {
    console.error('Create transporte error:', error)

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
      { success: false, error: 'Erro ao adicionar transporte' },
      { status: 500 }
    )
  }
}
