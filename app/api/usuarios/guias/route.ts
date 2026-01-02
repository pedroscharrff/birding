import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

// GET /api/usuarios/guias - Listar todos os guias da organização
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    console.log('[API] Buscando guias para orgId:', session.orgId)

    const guias = await prisma.usuario.findMany({
      where: {
        orgId: session.orgId,
        roleGlobal: 'guia',
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        roleGlobal: true,
        createdAt: true,
      },
      orderBy: {
        nome: 'asc',
      },
    })

    console.log('[API] Guias encontrados:', guias.length)

    if (guias.length === 0) {
      console.warn('[API] ⚠️ Nenhum guia encontrado! Verifique se existem usuários com roleGlobal="guia" e ativo=true')
    }

    return NextResponse.json({
      success: true,
      data: guias,
    })
  } catch (error: any) {
    console.error('Get guias error:', error)

    if (error.message === 'Não autenticado') {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar guias' },
      { status: 500 }
    )
  }
}
