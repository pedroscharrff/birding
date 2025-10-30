import { cookies } from 'next/headers'

const ACCESS_TOKEN_NAME = 'access_token'
const REFRESH_TOKEN_NAME = 'refresh_token'

/**
 * Definir cookie de acesso (HTTP-only, Secure em produção)
 */
export async function setAccessTokenCookie(token: string) {
  const cookieStore = await cookies()
  
  cookieStore.set(ACCESS_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutos
    path: '/',
  })
}

/**
 * Definir cookie de refresh (HTTP-only, Secure em produção)
 */
export async function setRefreshTokenCookie(token: string) {
  const cookieStore = await cookies()
  
  cookieStore.set(REFRESH_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })
}

/**
 * Obter access token do cookie
 */
export async function getAccessTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(ACCESS_TOKEN_NAME)?.value
}

/**
 * Obter refresh token do cookie
 */
export async function getRefreshTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(REFRESH_TOKEN_NAME)?.value
}

/**
 * Remover todos os cookies de autenticação
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  
  cookieStore.delete(ACCESS_TOKEN_NAME)
  cookieStore.delete(REFRESH_TOKEN_NAME)
}
