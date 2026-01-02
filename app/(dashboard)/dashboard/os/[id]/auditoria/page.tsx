'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { AuditoriaTimeline } from '@/components/os/auditoria-timeline'
import { AuditoriaStats } from '@/components/os/auditoria-stats'
import { AuditoriaFilters } from '@/components/os/auditoria-filters'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'

interface AuditoriaLog {
  id: string
  osId: string
  usuarioId: string
  usuarioNome: string
  usuarioRole: string
  acao: string
  entidade: string
  entidadeId: string | null
  dadosAntigos: any
  dadosNovos: any
  campos: string[]
  descricao: string
  metadata: any
  createdAt: string
  usuario: {
    id: string
    nome: string
    email: string
    roleGlobal: string
  }
}

interface AuditoriaStats {
  totalAcoes: number
  acoesUltimas24h: number
  usuariosMaisAtivos: {
    usuarioId: string
    usuarioNome: string
    quantidade: number
  }[]
  entidadesMaisAlteradas: {
    entidade: string
    quantidade: number
  }[]
}

interface Filters {
  usuarioId?: string
  acao?: string
  entidade?: string
  dataInicio?: string
  dataFim?: string
}

export default function AuditoriaPage() {
  const params = useParams()
  const osId = params.id as string

  const [logs, setLogs] = useState<AuditoriaLog[]>([])
  const [stats, setStats] = useState<AuditoriaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [fromCache, setFromCache] = useState(false)
  const [osTitle, setOsTitle] = useState<string>('...')

  // Buscar logs
  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: '20',
          ...(filters.usuarioId && { usuarioId: filters.usuarioId }),
          ...(filters.acao && { acao: filters.acao }),
          ...(filters.entidade && { entidade: filters.entidade }),
          ...(filters.dataInicio && { dataInicio: filters.dataInicio }),
          ...(filters.dataFim && { dataFim: filters.dataFim }),
        })

        const response = await fetch(`/api/os/${osId}/auditoria?${queryParams}`)

        if (!response.ok) {
          throw new Error('Erro ao carregar logs')
        }

        const data = await response.json()
        setLogs(data.data)
        setTotalPages(data.pagination.totalPages)
        setFromCache(data.metadata?.fromCache || false)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [osId, page, filters])

  // Buscar estatísticas
  useEffect(() => {
    async function fetchStats() {
      try {
        setStatsLoading(true)
        const response = await fetch(`/api/os/${osId}/auditoria/stats`)

        if (!response.ok) {
          throw new Error('Erro ao carregar estatísticas')
        }

        const data = await response.json()
        setStats(data.data)
      } catch (err: any) {
        console.error('Erro ao carregar stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [osId])

  // Buscar título da OS para breadcrumb
  useEffect(() => {
    let active = true
    async function fetchTitle() {
      try {
        const res = await fetch(`/api/os/${osId}`)
        if (!res.ok) return
        const data = await res.json()
        if (active && data?.data?.titulo) setOsTitle(data.data.titulo)
      } catch {}
    }
    fetchTitle()
    return () => {
      active = false
    }
  }, [osId])

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPage(1) // Reset para primeira página
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Operações', href: '/dashboard/os' },
          { label: osTitle, href: `/dashboard/os/${osId}` },
          { label: 'Auditoria' },
        ]}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditoria da OS</h1>
          <p className="text-muted-foreground mt-1">
            Histórico completo de todas as ações realizadas nesta OS
          </p>
        </div>
        {fromCache && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            Cache Ativo
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {!statsLoading && stats && (
        <AuditoriaStats stats={stats} />
      )}

      {/* Filtros */}
      <Card className="p-4">
        <AuditoriaFilters onFilterChange={handleFilterChange} />
      </Card>

      {/* Timeline */}
      <div>
        {error && (
          <Card className="p-6 border-red-200 bg-red-50">
            <p className="text-red-600">Erro: {error}</p>
          </Card>
        )}

        {loading ? (
          <Card className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-3 text-muted-foreground">Carregando logs...</span>
            </div>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              Nenhum log de auditoria encontrado
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {Object.keys(filters).length > 0
                ? 'Tente ajustar os filtros'
                : 'As ações realizadas nesta OS aparecerão aqui'}
            </p>
          </Card>
        ) : (
          <>
            <AuditoriaTimeline logs={logs} />

            {/* Paginação */}
            {totalPages > 1 && (
              <Card className="p-4 mt-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próxima
                  </button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
