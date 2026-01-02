import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

// GET /api/debug/usuarios - Debug: listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const usuarios = await prisma.usuario.findMany({
      where: {
        orgId: session.orgId,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        roleGlobal: true,
        ativo: true,
      },
      orderBy: {
        nome: 'asc',
      },
    })

    const stats = {
      total: usuarios.length,
      porRole: {
        admin: usuarios.filter(u => u.roleGlobal === 'admin').length,
        agente: usuarios.filter(u => u.roleGlobal === 'agente').length,
        guia: usuarios.filter(u => u.roleGlobal === 'guia').length,
        motorista: usuarios.filter(u => u.roleGlobal === 'motorista').length,
        fornecedor: usuarios.filter(u => u.roleGlobal === 'fornecedor').length,
        cliente: usuarios.filter(u => u.roleGlobal === 'cliente').length,
      },
      ativos: usuarios.filter(u => u.ativo).length,
      inativos: usuarios.filter(u => !u.ativo).length,
    }

    return NextResponse.json({
      success: true,
      data: {
        usuarios,
        stats,
      },
    })
  } catch (error: any) {
    console.error('Debug usuarios error:', error)

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
