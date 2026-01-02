"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ClipboardList,
  Columns3,
  Calendar,
  AlertTriangle,
  DollarSign,
  FileText,
  Users,
  Building2,
  Menu,
  X,
  ChevronLeft,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  user: any
  logout: () => void
  alertsCount?: number
}

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/os',
    label: 'Operações',
    icon: ClipboardList,
  },
  {
    href: '/dashboard/kanban',
    label: 'Kanban',
    icon: Columns3,
  },
  {
    href: '/dashboard/calendario',
    label: 'Calendário',
    icon: Calendar,
  },
  {
    href: '/dashboard/alerts',
    label: 'Alertas',
    icon: AlertTriangle,
    badge: true,
  },
  {
    href: '/dashboard/financeiro',
    label: 'Financeiro',
    icon: DollarSign,
  },
  {
    href: '/dashboard/cotacoes',
    label: 'Cotações',
    icon: FileText,
  },
  {
    href: '/dashboard/fornecedores',
    label: 'Fornecedores',
    icon: Building2,
  },
  {
    href: '/dashboard/usuarios',
    label: 'Usuários',
    icon: Users,
  },
]

export function Sidebar({ user, logout, alertsCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          // Mobile
          "transform lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop
          "lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link
            href="/dashboard"
            className={cn(
              "font-bold text-blue-600 transition-all",
              isCollapsed ? "lg:text-lg" : "text-xl"
            )}
            onClick={() => setIsOpen(false)}
          >
            {isCollapsed ? "OS" : "OS/Tour"}
          </Link>
          <button
            onClick={toggleCollapse}
            className="hidden lg:block p-1.5 hover:bg-gray-100 rounded-lg transition"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const showBadge = item.badge && alertsCount > 0

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group",
                      isActive
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-blue-600")} />
                    <span
                      className={cn(
                        "transition-all",
                        isCollapsed ? "lg:hidden" : ""
                      )}
                    >
                      {item.label}
                    </span>
                    {showBadge && (
                      <span
                        className={cn(
                          "ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5 font-medium",
                          isCollapsed && "lg:absolute lg:top-1 lg:right-1 lg:h-4 lg:min-w-[16px] lg:text-[10px]"
                        )}
                      >
                        {alertsCount}
                      </span>
                    )}
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <span className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-4">
          {user && (
            <div
              className={cn(
                "mb-3 pb-3 border-b border-gray-200",
                isCollapsed && "lg:hidden"
              )}
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.nome}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.roleGlobal}
              </p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className={cn(
              "w-full justify-start gap-2",
              isCollapsed && "lg:justify-center lg:px-2"
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className={cn(isCollapsed && "lg:hidden")}>Sair</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
