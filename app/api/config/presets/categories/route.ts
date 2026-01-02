import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createPresetCategorySchema } from '@/lib/validators/presets'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') as 'alergia' | 'restricao' | 'preferencia' | null

    const where: any = { orgId: session.orgId }
    if (tipo) where.tipo = tipo

    const categories = await prisma.presetCategory.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    console.error('GET categories error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao listar categorias' }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const validated = createPresetCategorySchema.parse(body)

    const created = await prisma.presetCategory.create({
      data: {
        orgId: session.orgId,
        nome: validated.nome,
        tipo: validated.tipo,
        parentId: validated.parentId || null,
        ordem: validated.ordem ?? null,
        ativo: validated.ativo ?? true,
      },
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('POST categories error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar categoria' }, { status: 500 })
  }
}
