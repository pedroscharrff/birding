import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils/cn'

interface KanbanColumnProps {
  id: string
  label: string
  color: string
  count: number
  children: React.ReactNode
}

export function KanbanColumn({ id, label, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    teal: 'bg-teal-50 border-teal-200',
    purple: 'bg-purple-50 border-purple-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    cyan: 'bg-cyan-50 border-cyan-200',
  }

  const headerColors: Record<string, string> = {
    gray: 'text-gray-700',
    blue: 'text-blue-700',
    yellow: 'text-yellow-700',
    green: 'text-green-700',
    indigo: 'text-indigo-700',
    teal: 'text-teal-700',
    purple: 'text-purple-700',
    emerald: 'text-emerald-700',
    cyan: 'text-cyan-700',
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[300px] max-w-[300px] rounded-lg border-2 p-4 transition-colors',
        colorClasses[color] || colorClasses.gray,
        isOver && 'ring-2 ring-blue-400 ring-opacity-50'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('font-semibold text-sm', headerColors[color] || headerColors.gray)}>
          {label}
        </h3>
        <span className="text-xs font-medium bg-white rounded-full px-2 py-1">
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}
