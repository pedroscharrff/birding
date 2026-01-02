"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/providers/AuthProvider'
import { AlertsSummary } from '@/components/dashboard/AlertsPanel'
import { useApi } from '@/hooks/useApi'
import type { Alert, AlertsCount } from '@/types/alerts'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, loading } = useAuth()

  // Buscar alertas se o usuário estiver autenticado
  const { data: alertsData } = useApi<{ alerts: Alert[], count: AlertsCount }>(
    user?.organizacao?.id ? `/api/alerts?orgId=${user.organizacao.id}` : ''
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                OS/Tour
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/os"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Operações
                </Link>
                <Link
                  href="/dashboard/kanban"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Kanban
                </Link>
                <Link
                  href="/dashboard/calendario"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Calendário
                </Link>
                <Link
                  href="/dashboard/alerts"
                  className="text-gray-600 hover:text-gray-900 transition relative"
                >
                  Alertas
                  {alertsData?.count && alertsData.count.total > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {alertsData.count.critical + alertsData.count.warning}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/financeiro"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Financeiro
                </Link>
                <Link
                  href="/dashboard/fornecedores"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Fornecedores
                </Link>
                <Link
                  href="/dashboard/usuarios"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Usuários
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {/* Resumo de alertas */}
              {alertsData?.count && (
                <Link href="/dashboard/alerts" className="hover:opacity-80 transition">
                  <AlertsSummary count={alertsData.count} />
                </Link>
              )}

              {user && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{user.nome}</span>
                  <span className="ml-2 text-xs text-gray-400">({user.roleGlobal})</span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={logout} disabled={loading}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
