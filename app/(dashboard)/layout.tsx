"use client"

import { useAuth } from '@/app/providers/AuthProvider'
import { Sidebar } from '@/components/navigation/Sidebar'
import { useApi } from '@/hooks/useApi'
import type { Alert, AlertsCount } from '@/types/alerts'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()

  const { data: alertsData } = useApi<{ alerts: Alert[], count: AlertsCount }>(
    user?.organizacao?.id ? `/api/alerts?orgId=${user.organizacao.id}` : ''
  )

  const alertsCount = alertsData?.count 
    ? alertsData.count.critical + alertsData.count.warning 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        user={user} 
        logout={logout} 
        alertsCount={alertsCount}
      />
      
      <main className="lg:pl-64 transition-all duration-300">
        <div className="container mx-auto px-4 py-8 lg:px-8">
          <div className="pt-16 lg:pt-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
