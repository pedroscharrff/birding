import { getAccessTokenCookie } from './cookies'
import { verifyAccessToken, JWTPayload } from './jwt'

/**
 * Obter sessão do usuário atual a partir do cookie
 * Retorna null se não autenticado
 */
export async function getSession(): Promise<JWTPayload | null> {
  try {
    const token = await getAccessTokenCookie()
    
    if (!token) {
      return null
    }

    const payload = await verifyAccessToken(token)
    return payload
  } catch (error) {
    return null
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
    throw new Error('Não autenticado')
  }
  
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
