import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/invoices/[id] - Get invoice by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
      include: {
        contaPagamento: true,
        os: {
          include: {
            hospedagens: true,
            atividades: true,
            transportes: true,
            passagensAereas: true,
            extensoes: {
              include: {
                hospedagens: true,
                atividades: true,
                transportes: true,
                passagensAereas: true,
              },
            },
          },
        },
        cotacao: {
          include: {
            itens: true,
          },
        },
        organizacao: {
          select: {
            nome: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice não encontrado' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error('Erro ao buscar invoice:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar invoice' },
      { status: 500 }
    )
  }
}

// PATCH /api/invoices/[id] - Update invoice status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { status } = body

    const invoiceAtualizado = await prisma.invoice.update({
      where: { id: params.id },
      data: { status },
    })

    return NextResponse.json(invoiceAtualizado)
  } catch (error: any) {
    console.error('Erro ao atualizar invoice:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice não encontrado' }, { status: 404 })
    }

    // Não permitir deletar invoices pagos
    if (invoice.status === 'pago') {
      return NextResponse.json(
        { error: 'Não é possível deletar invoice com status "pago"' },
        { status: 400 }
      )
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Invoice deletado com sucesso' })
  } catch (error: any) {
    console.error('Erro ao deletar invoice:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao deletar invoice' },
      { status: 500 }
    )
  }
}
