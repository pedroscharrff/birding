import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/contas-pagamento - Listar contas de pagamento
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const apenasAtivas = searchParams.get('ativas') === 'true'

    const contas = await prisma.contaPagamento.findMany({
      where: {
        orgId: session.orgId,
        ...(apenasAtivas && { ativo: true }),
      },
      orderBy: [
        { padrao: 'desc' },
        { nome: 'asc' },
      ],
    })

    return NextResponse.json(contas)
  } catch (error: any) {
    console.error('Erro ao buscar contas de pagamento:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar contas de pagamento' },
      { status: 500 }
    )
  }
}

// POST /api/contas-pagamento - Criar conta de pagamento
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

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
      padrao,
      observacoes,
    } = body

    // Se esta conta for marcada como padrão, desmarcar outras
    if (padrao) {
      await prisma.contaPagamento.updateMany({
        where: {
          orgId: session.orgId,
          padrao: true,
        },
        data: {
          padrao: false,
        },
      })
    }

    const novaConta = await prisma.contaPagamento.create({
      data: {
        orgId: session.orgId,
        nome,
        banco,
        agencia,
        conta,
        tipoConta,
        titular,
        documento,
        chavePix,
        tipoChavePix,
        padrao: padrao || false,
        observacoes,
      },
    })

    return NextResponse.json(novaConta, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar conta de pagamento:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar conta de pagamento' },
      { status: 500 }
    )
  }
}
