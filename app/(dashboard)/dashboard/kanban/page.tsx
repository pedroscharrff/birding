"use client"

import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorMessage } from '@/components/ui/error-message'
import { useApi } from '@/hooks/useApi'
import type { OS } from '@prisma/client'

interface OSWithDetails extends OS {
  _count: {
    participantes: number
    atividades: number
    hospedagens: number
  }
  agenteResponsavel: {
    id: string
    nome: string
    email: string
  }
}

export default function KanbanPage() {
  const { data: osList, loading, error, refetch } = useApi<OSWithDetails[]>('/api/os')

  if (loading) {
    return <KanbanSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-600 mt-2">
            Visualize e gerencie o status das operações
          </p>
        </div>
        <ErrorMessage
          title="Erro ao carregar operações"
          message={error}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
        <p className="text-gray-600 mt-2">
          Arraste e solte os cards para mudar o status das operações
        </p>
      </div>

      {!osList || osList.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Nenhuma operação cadastrada</p>
          <p className="text-sm">Crie uma nova OS para começar</p>
        </div>
      ) : (
        <KanbanBoard osList={osList} onUpdate={refetch} />
      )}
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="min-w-[300px] max-w-[300px] space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
