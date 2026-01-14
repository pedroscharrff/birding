import { cookies } from 'next/headers'

const ACCESS_TOKEN_NAME = 'access_token'
const REFRESH_TOKEN_NAME = 'refresh_token'

/**
 * Definir cookie de acesso (HTTP-only, Secure em produção)
 */
export async function setAccessTokenCookie(token: string) {
  const cookieStore = await cookies()
  
  // Secure: true apenas se HTTPS estiver configurado (via env var ou NODE_ENV)
  const isSecure = process.env.FORCE_SECURE_COOKIES === 'true' || 
                   (process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIES !== 'true')
  
  cookieStore.set(ACCESS_TOKEN_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax', // 'lax' é adequado para same-site; use 'none' apenas se cross-origin + secure
    maxAge: 60 * 30, // 30 minutos (aumentado de 15 para reduzir refreshes)
    path: '/',
  })
}

/**
 * Definir cookie de refresh (HTTP-only, Secure em produção)
 */
export async function setRefreshTokenCookie(token: string) {
  const cookieStore = await cookies()
  
  const isSecure = process.env.FORCE_SECURE_COOKIES === 'true' || 
                   (process.env.NODE_ENV === 'production' && process.env.DISABLE_SECURE_COOKIES !== 'true')
  
  cookieStore.set(REFRESH_TOKEN_NAME, token, {
    httpOnly: true,
    secure: isSecure,
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
