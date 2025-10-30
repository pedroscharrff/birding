import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
                  href="/dashboard/calendar"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Calendário
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
              <Button variant="ghost" size="sm">
                Perfil
              </Button>
              <Button variant="outline" size="sm">
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
