import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const osId = searchParams.get('osId')
    const cotacaoId = searchParams.get('cotacaoId')
    const status = searchParams.get('status')

    const where: any = {
      orgId: session.orgId,
    }

    if (osId) where.osId = osId
    if (cotacaoId) where.cotacaoId = cotacaoId
    if (status) where.status = status

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        contaPagamento: true,
        os: {
          select: {
            titulo: true,
            destino: true,
          },
        },
        cotacao: {
          select: {
            titulo: true,
            destino: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(invoices)
  } catch (error: any) {
    console.error('Erro ao buscar invoices:', error)
    
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar invoices' },
      { status: 500 }
    )
  }
}
