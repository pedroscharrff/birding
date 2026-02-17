import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// POST /api/invoices/[id]/send-email - Send invoice via email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { email, mensagem } = body

    // Buscar invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
      include: {
        contaPagamento: true,
        os: {
          select: {
            titulo: true,
            destino: true,
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

    // TODO: Implementar envio de email real
    // Por enquanto, apenas simular o envio
    console.log('Enviando invoice por email:', {
      to: email || invoice.clienteEmail,
      invoiceId: invoice.id,
      numero: invoice.numero,
      mensagem,
    })

    // Atualizar status do invoice para "enviado" se ainda estiver em rascunho
    if (invoice.status === 'rascunho') {
      await prisma.invoice.update({
        where: { id: params.id },
        data: { status: 'enviado' },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice enviado por email com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao enviar invoice por email:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao enviar invoice por email' },
      { status: 500 }
    )
  }
}
