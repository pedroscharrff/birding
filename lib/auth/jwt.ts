import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
)

const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production'
)

export interface JWTPayload {
  userId: string
  email: string
  roleGlobal: string
  orgId: string
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // 15 minutos
    .sign(JWT_SECRET)
}

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 dias
    .sign(JWT_REFRESH_SECRET)
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as unknown as JWTPayload
  } catch (error) {
    throw new Error('Token inválido ou expirado')
  }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  try {
    const verified = await jwtVerify(token, JWT_REFRESH_SECRET)
    return verified.payload as unknown as JWTPayload
  } catch (error) {
    throw new Error('Refresh token inválido ou expirado')
  }
}

export async function verifyAuth(request: Request): Promise<{
  valid: boolean
  payload?: JWTPayload
  error?: string
}> {
  try {
    // Tentar pegar token do header Authorization primeiro
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = await verifyAccessToken(token)
      return { valid: true, payload }
    }

    // Se não houver Bearer token, tentar pegar do cookie
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return { valid: false, error: 'Token não fornecido' }
    }

    // Extrair token do cookie
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    const token = cookies['accessToken']
    if (!token) {
      return { valid: false, error: 'Token não fornecido' }
    }

    const payload = await verifyAccessToken(token)
    return { valid: true, payload }
  } catch (error) {
    return { valid: false, error: 'Token inválido ou expirado' }
  }
}
