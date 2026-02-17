import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/contas-pagamento/[id] - Get payment account by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    const conta = await prisma.contaPagamento.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
    })

    if (!conta) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    return NextResponse.json(conta)
  } catch (error: any) {
    console.error('Erro ao buscar conta de pagamento:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar conta de pagamento' },
      { status: 500 }
    )
  }
}

// PATCH /api/contas-pagamento/[id] - Update payment account
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    // Verificar se a conta existe e pertence à organização
    const contaExistente = await prisma.contaPagamento.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
    })

    if (!contaExistente) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const {
      nome,
      banco,
      agencia,
      conta,
      tipoConta,
      titular,
      documento,
      chavePix,
      tipoChavePix,
      ativo,
      padrao,
      observacoes,
    } = body

    // Se esta conta for marcada como padrão, desmarcar outras
    if (padrao && !contaExistente.padrao) {
      await prisma.contaPagamento.updateMany({
        where: {
          orgId: session.orgId,
          padrao: true,
          id: { not: params.id },
        },
        data: {
          padrao: false,
        },
      })
    }

    const contaAtualizada = await prisma.contaPagamento.update({
      where: { id: params.id },
      data: {
        nome,
        banco,
        agencia,
        conta,
        tipoConta,
        titular,
        documento,
        chavePix,
        tipoChavePix,
        ativo,
        padrao,
        observacoes,
      },
    })

    return NextResponse.json(contaAtualizada)
  } catch (error: any) {
    console.error('Erro ao atualizar conta de pagamento:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar conta de pagamento' },
      { status: 500 }
    )
  }
}

// DELETE /api/contas-pagamento/[id] - Delete payment account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    // Verificar se a conta existe e pertence à organização
    const conta = await prisma.contaPagamento.findFirst({
      where: {
        id: params.id,
        orgId: session.orgId,
      },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    })

    if (!conta) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    // Verificar se há invoices associados
    if (conta._count.invoices > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir conta com invoices associados' },
        { status: 400 }
      )
    }

    await prisma.contaPagamento.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Conta excluída com sucesso' })
  } catch (error: any) {
    console.error('Erro ao excluir conta de pagamento:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao excluir conta de pagamento' },
      { status: 500 }
    )
  }
}
