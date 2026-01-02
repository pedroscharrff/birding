import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { updatePresetItemSchema } from '@/lib/validators/presets'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const validated = updatePresetItemSchema.parse(body)

    const existing = await prisma.presetItem.findFirst({
      where: { id: params.id, orgId: session.orgId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Item não encontrado' }, { status: 404 })
    }

    const updated = await prisma.presetItem.update({
      where: { id: params.id },
      data: {
        label: validated.label ?? undefined,
        tipo: validated.tipo ?? undefined,
        categoriaId: validated.categoriaId !== undefined ? (validated.categoriaId || null) : undefined,
        descricao: validated.descricao !== undefined ? (validated.descricao || null) : undefined,
        ordem: validated.ordem !== undefined ? validated.ordem : undefined,
        ativo: validated.ativo !== undefined ? validated.ativo : undefined,
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
    console.error('PATCH item error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const existing = await prisma.presetItem.findFirst({
      where: { id: params.id, orgId: session.orgId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Item não encontrado' }, { status: 404 })
    }

    await prisma.presetItem.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    console.error('DELETE item error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir item' }, { status: 500 })
  }
}
