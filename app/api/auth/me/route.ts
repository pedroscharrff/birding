import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await getSession()
    console.log('[AUTH][ME][GET] session', session ? { userId: session.userId, orgId: session.orgId } : null)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    // Buscar dados completos do usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        roleGlobal: true,
        ativo: true,
        organizacao: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    })
    console.log('[AUTH][ME][GET] usuario found?', Boolean(usuario))
    
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: usuario,
    })
  } catch (error) {
    console.error('Get user error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erro ao obter dados do usuário' },
      { status: 500 }
    )
  }
}
