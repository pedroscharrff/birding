import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { updatePresetCategorySchema } from '@/lib/validators/presets'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const validated = updatePresetCategorySchema.parse(body)

    const existing = await prisma.presetCategory.findFirst({
      where: { id: params.id, orgId: session.orgId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Categoria não encontrada' }, { status: 404 })
    }

    const updated = await prisma.presetCategory.update({
      where: { id: params.id },
      data: {
        nome: validated.nome ?? undefined,
        tipo: validated.tipo ?? undefined,
        parentId: validated.parentId !== undefined ? (validated.parentId || null) : undefined,
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
    console.error('PATCH category error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar categoria' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const existing = await prisma.presetCategory.findFirst({
      where: { id: params.id, orgId: session.orgId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Categoria não encontrada' }, { status: 404 })
    }

    await prisma.presetCategory.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Não autenticado') {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    console.error('DELETE category error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao excluir categoria' }, { status: 500 })
  }
}
