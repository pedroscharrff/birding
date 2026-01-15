import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createHospedagemSchema } from '@/lib/validators/hospedagem'
import { logAuditoria } from '@/lib/services/auditoria'

// POST /api/os/[id]/hospedagens - Adicionar hospedagem
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id: osId } = params
    const body = await request.json()

    // Validar entrada
    const validatedData = createHospedagemSchema.parse({
      ...body,
      osId,
    })

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

    // Buscar dados do fornecedor
    const fornecedor = await prisma.fornecedor.findFirst({
      where: {
        id: validatedData.fornecedorId,
        orgId: session.orgId,
      },
      select: {
        id: true,
        nomeFantasia: true,
      },
    })

    if (!fornecedor) {
      return NextResponse.json(
        { success: false, error: 'Fornecedor não encontrado' },
        { status: 404 }
      )
    }

    // Criar hospedagem
    const hospedagem = await prisma.hospedagem.create({
      data: {
        osId: validatedData.osId,
        hotelNome: fornecedor.nomeFantasia,
        checkin: new Date(validatedData.checkin),
        checkout: new Date(validatedData.checkout),
        moeda: validatedData.moeda,
        fornecedorId: validatedData.fornecedorId,
        ...(validatedData.tarifaId && { tarifaId: validatedData.tarifaId }),
        ...(validatedData.quartos && { quartos: validatedData.quartos }),
        ...(validatedData.tipoQuarto && { tipoQuarto: validatedData.tipoQuarto }),
        ...(validatedData.regime && { regime: validatedData.regime }),
        ...(validatedData.custoTotal && { custoTotal: validatedData.custoTotal }),
        ...(validatedData.observacoes && { observacoes: validatedData.observacoes }),
        ...(validatedData.reservasRefs && { reservasRefs: validatedData.reservasRefs }),
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
        entidade: 'hospedagem',
        entidadeId: hospedagem.id,
        dadosNovos: hospedagem,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('[Auditoria] Erro ao registrar log:', auditError)
    }

    // Revalidar cache para atualizar a lista de hospedagens
    revalidatePath(`/dashboard/os/${osId}`)
    revalidatePath('/dashboard/os')

    return NextResponse.json(
      {
        success: true,
        data: hospedagem,
        message: 'Hospedagem adicionada com sucesso',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create hospedagem error:', error)

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
      { success: false, error: 'Erro ao adicionar hospedagem' },
      { status: 500 }
    )
  }
}
