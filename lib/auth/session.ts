import { getAccessTokenCookie, getRefreshTokenCookie, setAccessTokenCookie } from './cookies'
import { verifyAccessToken, verifyRefreshToken, signAccessToken, JWTPayload } from './jwt'

/**
 * Obter sessão do usuário atual a partir do cookie
 * Retorna null se não autenticado
 */
export async function getSession(): Promise<JWTPayload | null> {
  try {
    const token = await getAccessTokenCookie()
    console.log('[AUTH][getSession] access token present?', Boolean(token))
    
    if (!token) {
      // Tentativa de refresh direto, caso não haja access token mas exista refresh token
      const refreshToken = await getRefreshTokenCookie()
      console.log('[AUTH][getSession] no access token, refresh present?', Boolean(refreshToken))
      if (!refreshToken) {
        console.warn('[AUTH][getSession] no tokens available - user not authenticated')
        return null
      }
      try {
        const payload = await verifyRefreshToken(refreshToken)
        const newAccess = await signAccessToken(payload)
        await setAccessTokenCookie(newAccess)
        console.log('[AUTH][getSession] refreshed from refresh-only path, userId:', payload.userId)
        return payload
      } catch (e: any) {
        console.error('[AUTH][getSession] refresh-only path failed:', e?.message || e)
        return null
      }
    }

    const payload = await verifyAccessToken(token)
    console.log('[AUTH][getSession] payload', { userId: payload.userId, orgId: payload.orgId, role: payload.roleGlobal })
    return payload
  } catch (error: any) {
    // Access token inválido/expirado: tentar refresh token
    console.warn('[AUTH][getSession] access verify failed:', error?.message || error)
    try {
      const refreshToken = await getRefreshTokenCookie()
      console.log('[AUTH][getSession] attempting refresh, refresh present?', Boolean(refreshToken))
      if (!refreshToken) {
        console.error('[AUTH][getSession] no refresh token available after access token failure')
        return null
      }
      const payload = await verifyRefreshToken(refreshToken)
      const newAccess = await signAccessToken(payload)
      await setAccessTokenCookie(newAccess)
      console.log('[AUTH][getSession] access refreshed successfully, userId:', payload.userId)
      return payload
    } catch (e: any) {
      console.error('[AUTH][getSession] refresh failed:', e?.message || e)
      return null
    }
  }
}

/**
 * Verificar se o usuário está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

/**
 * Obter sessão ou lançar erro se não autenticado
 */
export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession()
  
  if (!session) {
    console.error('[AUTH][requireAuth] authentication required but no valid session found')
    throw new Error('Não autenticado')
  }
  
  console.log('[AUTH][requireAuth] authenticated:', { userId: session.userId, orgId: session.orgId })
  return session
}

/**
 * Verificar se o usuário tem um dos papéis especificados
 */
export async function hasRole(roles: string[]): Promise<boolean> {
  const session = await getSession()
  
  if (!session) {
    return false
  }
  
  return roles.includes(session.roleGlobal)
}

/**
 * Verificar se o usuário tem um dos papéis ou lançar erro
 */
export async function requireRole(roles: string[]): Promise<JWTPayload> {
  const session = await requireAuth()
  
  if (!roles.includes(session.roleGlobal)) {
    throw new Error('Permissão negada')
  }
  
  return session
}
