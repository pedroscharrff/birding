import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth/cookies'

export async function POST() {
  try {
    await clearAuthCookies()
    
    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    })
  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erro ao realizar logout' },
      { status: 500 }
    )
  }
}
