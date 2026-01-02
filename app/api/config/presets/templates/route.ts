import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { createPresetTemplateSchema } from '@/lib/validators/presets'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') as 'alergia' | 'restricao' | 'preferencia' | null
    const ativo = searchParams.get('ativo')

    const where: any = { orgId: session.orgId }
    if (tipo) where.tipo = tipo
    if (ativo === 'true') where.ativo = true
    if (ativo === 'false') where.ativo = false

    const templates = await prisma.presetTemplate.findMany({
      where,
      include: {
        items: {
          include: {
            item: true,
          },
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: [{ usoCount: 'desc' }, { nome: 'asc' }],
    })

    return NextResponse.json({ success: true, data: templates })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    console.error('GET templates error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao listar templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const validated = createPresetTemplateSchema.parse(body)

    // Verificar se todos os items existem e pertencem à organização
    const items = await prisma.presetItem.findMany({
      where: {
        id: { in: validated.itemIds },
        orgId: session.orgId,
        tipo: validated.tipo,
      },
    })

    if (items.length !== validated.itemIds.length) {
      return NextResponse.json(
        { success: false, error: 'Um ou mais itens não foram encontrados' },
        { status: 400 }
      )
    }

    const created = await prisma.presetTemplate.create({
      data: {
        orgId: session.orgId,
        nome: validated.nome,
        tipo: validated.tipo,
        descricao: validated.descricao || null,
        ativo: validated.ativo ?? true,
        items: {
          create: validated.itemIds.map((itemId, index) => ({
            itemId,
            ordem: index,
          })),
        },
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
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
    console.error('POST templates error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar template' }, { status: 500 })
  }
}
