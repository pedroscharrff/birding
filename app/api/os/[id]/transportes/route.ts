import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { logAuditoria } from '@/lib/services/auditoria'

// POST /api/os/[id]/transportes - Adicionar transporte
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const osId = params.id

    const { tipo, fornecedorId, origem, destino, dataPartida, dataChegada, custo, moeda } = body

    if (!tipo) {
      return NextResponse.json(
        { success: false, error: 'Tipo de transporte é obrigatório' },
        { status: 400 }
      )
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
    if (fornecedorId) {
      const fornecedor = await prisma.fornecedor.findFirst({
        where: {
          id: fornecedorId,
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
        tipo,
        fornecedorId: fornecedorId || null,
        origem: origem || null,
        destino: destino || null,
        dataPartida: dataPartida ? new Date(dataPartida) : null,
        dataChegada: dataChegada ? new Date(dataChegada) : null,
        custo: custo ? parseFloat(custo) : null,
        moeda: moeda || 'BRL',
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

    return NextResponse.json(
      { success: false, error: 'Erro ao adicionar transporte' },
      { status: 500 }
    )
  }
}
