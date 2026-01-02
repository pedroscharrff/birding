"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Usuario, Organizacao, RoleGlobal } from '@prisma/client'

interface AuthUser {
  id: string
  nome: string
  email: string
  telefone: string | null
  roleGlobal: RoleGlobal
  ativo: boolean
  organizacao: {
    id: string
    nome: string
  }
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setUser(data.data)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  // Redirect logic
  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login' || pathname === '/'
      const isDashboard = pathname?.startsWith('/dashboard')

      if (!user && isDashboard) {
        // Not authenticated, trying to access dashboard
        router.push('/login')
      } else if (user && isAuthPage) {
        // Authenticated, on login page
        router.push('/dashboard')
      }
    }
  }, [user, loading, pathname, router])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Falha no login')
    }

    setUser(data.data.usuario)
    router.push('/dashboard')
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/login')
    }
  }

  const refetch = async () => {
    setLoading(true)
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  )
}
