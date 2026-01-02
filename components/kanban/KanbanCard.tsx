import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Users, Activity, Home, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
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

interface KanbanCardProps {
  os: OSWithDetails
  isDragging?: boolean
  isSyncing?: boolean
}

export function KanbanCard({ os, isDragging = false, isSyncing = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: os.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isBeingDragged = isDragging || isSortableDragging

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none',
        isBeingDragged && 'opacity-50'
      )}
    >
      <Card className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative',
        isBeingDragged && 'shadow-xl',
        isSyncing && 'ring-2 ring-blue-400 ring-opacity-30'
      )}>
        {isSyncing && (
          <div className="absolute top-2 right-2 z-10">
            <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
          </div>
        )}
        <CardHeader className="pb-3">
          <h4 className="font-semibold text-sm leading-tight line-clamp-2">
            {os.titulo}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {os.destino}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Datas */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(os.dataInicio), 'dd MMM', { locale: ptBR })} - {format(new Date(os.dataFim), 'dd MMM', { locale: ptBR })}
            </span>
          </div>

          {/* Contadores */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{os._count.participantes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>{os._count.atividades}</span>
            </div>
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              <span>{os._count.hospedagens}</span>
            </div>
          </div>

          {/* Responsável */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Responsável:</span>
            <span className="font-medium text-gray-700">{os.agenteResponsavel.nome}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
