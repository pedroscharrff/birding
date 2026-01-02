import { NextRequest, NextResponse } from 'next/server'
import { activatePolicy } from '@/lib/services/policy'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Buscar orgId da política
    const policy = await prisma.organizacaoPolicy.findUnique({
      where: { id: params.id },
      select: { orgId: true },
    })

    if (!policy) {
      return NextResponse.json({ error: 'Política não encontrada' }, { status: 404 })
    }

    await activatePolicy(policy.orgId, params.id)

    return NextResponse.json({ success: true, message: 'Política ativada com sucesso' })
  } catch (error) {
    console.error('[API Policies] Erro ao ativar:', error)
    return NextResponse.json({ error: 'Erro ao ativar política' }, { status: 500 })
  }
}
