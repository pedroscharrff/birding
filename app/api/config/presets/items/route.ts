import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createPresetItemSchema } from '@/lib/validators/presets'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') as 'alergia' | 'restricao' | 'preferencia' | null
    const categoriaId = searchParams.get('categoriaId')
    const ativo = searchParams.get('ativo')

    const where: any = { orgId: session.orgId }
    if (tipo) where.tipo = tipo
    if (categoriaId) where.categoriaId = categoriaId
    if (ativo === 'true') where.ativo = true
    if (ativo === 'false') where.ativo = false

    const items = await prisma.presetItem.findMany({
      where,
      orderBy: [{ ordem: 'asc' }, { label: 'asc' }],
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    console.error('GET items error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao listar itens' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const validated = createPresetItemSchema.parse(body)

    const created = await prisma.presetItem.create({
      data: {
        orgId: session.orgId,
        tipo: validated.tipo,
        label: validated.label,
        categoriaId: validated.categoriaId || null,
        descricao: validated.descricao || null,
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
    console.error('POST items error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar item' }, { status: 500 })
  }
}
