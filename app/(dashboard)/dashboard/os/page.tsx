"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorMessage } from '@/components/ui/error-message'
import { CreateOSDialog } from '@/components/forms/CreateOSDialog'
import { usePaginatedApi } from '@/hooks/useApi'
import { OSStatusSelect } from '@/components/os/OSStatusSelect'
import { OSIndicators, OSCompletenessBar } from '@/components/os/OSIndicators'
import type { OS } from '@prisma/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OSWithCounts extends OS {
  _count: {
    participantes: number
    atividades: number
    hospedagens: number
    transportes: number
  }
  agenteResponsavel: {
    id: string
    nome: string
    email: string
  }
}

export default function OSPage() {
  const [filters, setFilters] = useState({
    titulo: '',
    destino: '',
    dataInicio: '',
    dataFim: '',
    status: '',
    page: 1,
  })

  const { data: response, loading, error, refetch } = usePaginatedApi<OSWithCounts>('/api/os', filters)

  // Estado local otimista para lista de OS
  const [localOsList, setLocalOsList] = useState<OSWithCounts[]>([])

  // Sincroniza quando os dados chegarem
  useEffect(() => {
    if (response?.data) {
      setLocalOsList(response.data)
    }
  }, [response?.data])

  const handleFilterChange = (field: string, value: string) => {
    const newValue = value === 'all' ? '' : value
    setFilters(prev => ({ ...prev, [field]: newValue, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleStatusChange = (osId: string, newStatus: string) => {
    // Atualização otimista na lista
    setLocalOsList((prev) =>
      prev.map((os) =>
        os.id === osId ? { ...os, status: newStatus as any } : os
      )
    )
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Operações' },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todas as operações de turismo
          </p>
        </div>
        <CreateOSDialog onSuccess={refetch} />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Encontre operações específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            <Input
              placeholder="Buscar por título..."
              value={filters.titulo}
              onChange={(e) => handleFilterChange('titulo', e.target.value)}
            />
            <Input
              placeholder="Destino..."
              value={filters.destino}
              onChange={(e) => handleFilterChange('destino', e.target.value)}
            />
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="planejamento">Planejamento</SelectItem>
                <SelectItem value="cotacoes">Cotações</SelectItem>
                <SelectItem value="reservas_pendentes">Reservas Pendentes</SelectItem>
                <SelectItem value="reservas_confirmadas">Reservas Confirmadas</SelectItem>
                <SelectItem value="documentacao">Documentação</SelectItem>
                <SelectItem value="pronto_para_viagem">Pronto para Viagem</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="pos_viagem">Pós-Viagem</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Data início"
              value={filters.dataInicio}
              onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
            />
            <Input
              type="date"
              placeholder="Data fim"
              value={filters.dataFim}
              onChange={(e) => handleFilterChange('dataFim', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de OS */}
      {loading ? (
        <OSListSkeleton />
      ) : error ? (
        <ErrorMessage
          title="Erro ao carregar operações"
          message={error}
          onRetry={refetch}
        />
      ) : !response || !response.data || response.data.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              Nenhuma operação encontrada
            </p>
            <div className="flex justify-center mt-4">
              <CreateOSDialog onSuccess={refetch} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localOsList.map((os) => (
            <Card key={os.id} className="hover:shadow-md transition">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/dashboard/os/${os.id}`} className="flex-1 cursor-pointer min-w-0">
                    <CardTitle className="text-xl hover:text-blue-600 transition">{os.titulo}</CardTitle>
                    <CardDescription>
                      {os.destino} - {format(new Date(os.dataInicio), 'dd MMM', { locale: ptBR })} a {format(new Date(os.dataFim), 'dd MMM yyyy', { locale: ptBR })}
                    </CardDescription>
                  </Link>
                  <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                    <OSStatusSelect
                      osId={os.id}
                      osTitulo={os.titulo}
                      currentStatus={os.status}
                      onStatusChange={(newStatus) => handleStatusChange(os.id, newStatus)}
                      variant="badge"
                      size="sm"
                    />
                  </div>
                </div>

                {/* Indicadores Visuais */}
                <div className="mt-3">
                  <OSIndicators
                    os={os}
                    compact={true}
                    showLabels={false}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold">{os._count.participantes}</span> Participantes
                  </div>
                  <div>
                    <span className="font-semibold">{os._count.atividades}</span> Atividades
                  </div>
                  <div>
                    <span className="font-semibold">{os._count.hospedagens}</span> Hospedagens
                  </div>
                  <div className="ml-auto">
                    Responsável: <span className="font-semibold">{os.agenteResponsavel.nome}</span>
                  </div>
                </div>

                {/* Barra de Completude */}
                <OSCompletenessBar os={os} />
              </CardContent>
            </Card>
          ))}

          {/* Paginação */}
          {response.pagination && response.pagination.totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Página {response.pagination.page} de {response.pagination.totalPages} ({response.pagination.total} resultados)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, response.pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={filters.page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                      {response.pagination.totalPages > 5 && (
                        <>
                          <span className="px-2">...</span>
                          <Button
                            variant={filters.page === response.pagination.totalPages ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(response.pagination.totalPages)}
                            className="w-10"
                          >
                            {response.pagination.totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= response.pagination.totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function OSListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-6 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48 ml-auto" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
