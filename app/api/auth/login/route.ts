import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { loginSchema } from '@/lib/validators/auth'
import { verifyPassword } from '@/lib/auth/password'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/lib/auth/cookies'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar entrada
    const validatedData = loginSchema.parse(body)
    
    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email: validatedData.email },
      include: { organizacao: true },
    })
    
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }
    
    // Verificar se está ativo
    if (!usuario.ativo) {
      return NextResponse.json(
        { success: false, error: 'Usuário inativo' },
        { status: 403 }
      )
    }
    
    // Verificar senha
    const isValidPassword = await verifyPassword(validatedData.password, usuario.hashSenha)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }
    
    // Gerar tokens
    const payload = {
      userId: usuario.id,
      email: usuario.email,
      roleGlobal: usuario.roleGlobal,
      orgId: usuario.orgId,
    }
    
    const accessToken = await signAccessToken(payload)
    const refreshToken = await signRefreshToken(payload)
    
    // Definir cookies
    await setAccessTokenCookie(accessToken)
    await setRefreshTokenCookie(refreshToken)
    
    return NextResponse.json({
      success: true,
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          roleGlobal: usuario.roleGlobal,
          organizacao: usuario.organizacao.nome,
        },
      },
      message: 'Login realizado com sucesso',
    })
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erro ao realizar login' },
      { status: 500 }
    )
  }
}
