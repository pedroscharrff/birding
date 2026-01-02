import { NextRequest, NextResponse } from 'next/server'
import { updatePolicy } from '@/lib/services/policy'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const policy = await prisma.organizacaoPolicy.findUnique({
      where: { id: params.id },
    })

    if (!policy) {
      return NextResponse.json({ error: 'Política não encontrada' }, { status: 404 })
    }

    return NextResponse.json(policy)
  } catch (error) {
    console.error('[API Policies] Erro ao buscar:', error)
    return NextResponse.json({ error: 'Erro ao buscar política' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const policy = await updatePolicy(params.id, body)
    return NextResponse.json(policy)
  } catch (error) {
    console.error('[API Policies] Erro ao atualizar:', error)
    return NextResponse.json({ error: 'Erro ao atualizar política' }, { status: 500 })
  }
}
