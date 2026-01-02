import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { updatePresetTemplateSchema } from '@/lib/validators/presets'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const validated = updatePresetTemplateSchema.parse(body)

    const existing = await prisma.presetTemplate.findFirst({
      where: { id: params.id, orgId: session.orgId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    // Se itemIds foi fornecido, validar e atualizar
    if (validated.itemIds) {
      const items = await prisma.presetItem.findMany({
        where: {
          id: { in: validated.itemIds },
          orgId: session.orgId,
          tipo: existing.tipo,
        },
      })

      if (items.length !== validated.itemIds.length) {
        return NextResponse.json(
          { success: false, error: 'Um ou mais itens não foram encontrados' },
          { status: 400 }
        )
      }

      // Deletar items antigos e criar novos
      await prisma.presetTemplateItem.deleteMany({
        where: { templateId: params.id },
      })

      await prisma.presetTemplateItem.createMany({
        data: validated.itemIds.map((itemId, index) => ({
          templateId: params.id,
          itemId,
          ordem: index,
        })),
      })
    }

    const updated = await prisma.presetTemplate.update({
      where: { id: params.id },
      data: {
        nome: validated.nome ?? undefined,
        descricao: validated.descricao !== undefined ? (validated.descricao || null) : undefined,
        ativo: validated.ativo !== undefined ? validated.ativo : undefined,
      },
      include: {
        items: {
          include: {
            item: true,
          },
          orderBy: { ordem: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('PATCH template error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const existing = await prisma.presetTemplate.findFirst({
      where: { id: params.id, orgId: session.orgId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    await prisma.presetTemplate.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    console.error('DELETE template error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir template' }, { status: 500 })
  }
}

// Apply template (incrementa uso)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const existing = await prisma.presetTemplate.findFirst({
      where: { id: params.id, orgId: session.orgId },
      include: {
        items: {
          include: {
            item: true,
          },
          orderBy: { ordem: 'asc' },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    // Incrementar uso do template e dos itens
    await prisma.presetTemplate.update({
      where: { id: params.id },
      data: {
        usoCount: { increment: 1 },
        ultimoUso: new Date(),
      },
    })

    const itemIds = existing.items.map(ti => ti.itemId)
    await prisma.presetItem.updateMany({
      where: { id: { in: itemIds } },
      data: {
        usoCount: { increment: 1 },
        ultimoUso: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        items: existing.items.map(ti => ti.item.label),
      },
    })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    console.error('POST apply template error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao aplicar template' }, { status: 500 })
  }
}
