import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { trackPresetUsageSchema } from '@/lib/validators/presets'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const validated = trackPresetUsageSchema.parse(body)

    // Incrementar uso dos itens
    await prisma.presetItem.updateMany({
      where: {
        id: { in: validated.itemIds },
        orgId: session.orgId,
      },
      data: {
        usoCount: { increment: 1 },
        ultimoUso: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('POST track usage error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao registrar uso' }, { status: 500 })
  }
}
