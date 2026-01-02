"use client"

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { useToast } from '@/hooks/useToast'
import type { OS, StatusOS } from '@prisma/client'

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

interface KanbanBoardProps {
  osList: OSWithDetails[]
  onUpdate: () => void
}

const STATUS_COLUMNS: { id: StatusOS; label: string; color: string }[] = [
  { id: 'planejamento', label: 'Planejamento', color: 'gray' },
  { id: 'cotacoes', label: 'Cotações', color: 'blue' },
  { id: 'reservas_pendentes', label: 'Reservas Pendentes', color: 'yellow' },
  { id: 'reservas_confirmadas', label: 'Confirmadas', color: 'green' },
  { id: 'documentacao', label: 'Documentação', color: 'indigo' },
  { id: 'pronto_para_viagem', label: 'Pronto p/ Viagem', color: 'teal' },
  { id: 'em_andamento', label: 'Em Andamento', color: 'purple' },
  { id: 'concluida', label: 'Concluída', color: 'emerald' },
  { id: 'pos_viagem', label: 'Pós-Viagem', color: 'cyan' },
]

export function KanbanBoard({ osList, onUpdate }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [optimisticList, setOptimisticList] = useState<OSWithDetails[]>(osList)
  const [syncing, setSyncing] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Sincronizar lista otimista com a real quando a prop mudar
  useEffect(() => {
    setOptimisticList(osList)
  }, [osList])

  // Agrupar OS por status (usando lista otimista)
  const columns = useMemo(() => {
    const grouped: Record<StatusOS, OSWithDetails[]> = {
      planejamento: [],
      cotacoes: [],
      reservas_pendentes: [],
      reservas_confirmadas: [],
      documentacao: [],
      pronto_para_viagem: [],
      em_andamento: [],
      concluida: [],
      pos_viagem: [],
      cancelada: [],
    }

    optimisticList.forEach((os) => {
      if (grouped[os.status]) {
        grouped[os.status].push(os)
      }
    })

    return grouped
  }, [optimisticList])

  const activeOS = useMemo(() => {
    if (!activeId) return null
    return optimisticList.find((os) => os.id === activeId)
  }, [activeId, optimisticList])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const osId = active.id as string
    const newStatus = over.id as StatusOS

    const os = optimisticList.find((item) => item.id === osId)
    if (!os) return

    // Se não mudou de coluna, não faz nada
    if (os.status === newStatus) return

    const oldStatus = os.status

    // 1. ATUALIZAÇÃO OTIMISTA - muda imediatamente na UI
    setOptimisticList((prev) =>
      prev.map((item) =>
        item.id === osId ? { ...item, status: newStatus } : item
      )
    )

    // Marca como sincronizando
    setSyncing((prev) => new Set(prev).add(osId))

    // 2. SINCRONIZAR COM SERVIDOR em background
    try {
      const res = await fetch(`/api/os/${osId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar status')
      }

      // Sincronização bem-sucedida - não precisa refetch, UI já está atualizada!
    } catch (error: any) {
      // 3. ROLLBACK - se falhar, volta ao status anterior
      setOptimisticList((prev) =>
        prev.map((item) =>
          item.id === osId ? { ...item, status: oldStatus } : item
        )
      )

      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      // Remove do estado de sincronização
      setSyncing((prev) => {
        const next = new Set(prev)
        next.delete(osId)
        return next
      })
    }
  }, [optimisticList, toast])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            label={column.label}
            color={column.color}
            count={columns[column.id]?.length || 0}
          >
            <SortableContext
              items={columns[column.id]?.map((os) => os.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 min-h-[200px]">
                {columns[column.id]?.map((os) => (
                  <KanbanCard
                    key={os.id}
                    os={os}
                    isSyncing={syncing.has(os.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeOS ? <KanbanCard os={activeOS} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
