import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') as 'alergia' | 'restricao' | 'preferencia' | null
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {
      orgId: session.orgId,
      ativo: true,
      usoCount: { gt: 0 },
    }
    if (tipo) where.tipo = tipo

    const items = await prisma.presetItem.findMany({
      where,
      include: {
        categoria: true,
      },
      orderBy: [
        { usoCount: 'desc' },
        { ultimoUso: 'desc' },
      ],
      take: limit,
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    console.error('GET most used error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar itens mais usados' }, { status: 500 })
  }
}
