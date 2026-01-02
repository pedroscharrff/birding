"use client"

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOptimisticUpdate } from '@/hooks/useOptimisticApi'
import { Loader2 } from 'lucide-react'
import { StatusTransitionModal } from './StatusTransitionModal'
import type { StatusOS } from '@prisma/client'

interface OSStatusSelectProps {
  osId: string
  osTitulo?: string
  currentStatus: string
  onStatusChange?: (newStatus: string) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'badge'
}

const STATUS_OPTIONS = [
  { value: 'planejamento', label: 'Planejamento', color: 'bg-gray-100 text-gray-700' },
  { value: 'cotacoes', label: 'Cotações', color: 'bg-blue-100 text-blue-700' },
  { value: 'reservas_pendentes', label: 'Reservas Pendentes', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'reservas_confirmadas', label: 'Confirmadas', color: 'bg-green-100 text-green-700' },
  { value: 'documentacao', label: 'Documentação', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'pronto_para_viagem', label: 'Pronto p/ Viagem', color: 'bg-teal-100 text-teal-700' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-purple-100 text-purple-700' },
  { value: 'concluida', label: 'Concluída', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'pos_viagem', label: 'Pós-Viagem', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-700' },
]

export function OSStatusSelect({
  osId,
  osTitulo = 'OS',
  currentStatus,
  onStatusChange,
  size = 'md',
  variant = 'inline',
}: OSStatusSelectProps) {
  const [localStatus, setLocalStatus] = useState(currentStatus)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [showTransitionModal, setShowTransitionModal] = useState(false)
  const { update, isUpdating } = useOptimisticUpdate()

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === localStatus)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === localStatus) return

    // Guarda o status pendente e mostra o modal de validação
    setPendingStatus(newStatus)
    setShowTransitionModal(true)
  }

  const handleConfirmChange = async (justificativa?: string) => {
    if (!pendingStatus) return

    const oldStatus = localStatus
    const newStatus = pendingStatus

    await update({
      endpoint: `/api/os/${osId}`,
      optimisticData: newStatus,
      updateFn: (status) => {
        setLocalStatus(status)
        if (onStatusChange) {
          onStatusChange(status)
        }
      },
      rollbackFn: () => {
        setLocalStatus(oldStatus)
        if (onStatusChange) {
          onStatusChange(oldStatus)
        }
      },
      payload: {
        status: newStatus,
        ...(justificativa && { motivo: justificativa }),
      },
      successMessage: 'Status atualizado com sucesso',
      errorMessage: 'Erro ao atualizar status',
    })

    // Limpa e fecha
    setPendingStatus(null)
  }

  const handleCancelChange = () => {
    setPendingStatus(null)
    setShowTransitionModal(false)
  }

  if (variant === 'badge') {
    return (
      <>
        <Select
          value={localStatus}
          onValueChange={handleStatusChange}
          disabled={isUpdating}
        >
          <SelectTrigger
            className={`${
              size === 'sm' ? 'h-7 text-xs px-2' : size === 'lg' ? 'h-11 text-base' : 'h-9 text-sm'
            } border-0 ${currentOption?.color || 'bg-gray-100'} font-semibold rounded-full`}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${option.color}`}>
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pendingStatus && (
          <StatusTransitionModal
            open={showTransitionModal}
            onClose={handleCancelChange}
            osId={osId}
            osTitulo={osTitulo}
            fromStatus={localStatus as StatusOS}
            toStatus={pendingStatus as StatusOS}
            onConfirm={handleConfirmChange}
          />
        )}
      </>
    )
  }

  // Variant inline
  return (
    <>
      <Select
        value={localStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger
          className={
            size === 'sm' ? 'h-8 text-sm' : size === 'lg' ? 'h-11 text-base' : 'h-10'
          }
        >
          {isUpdating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Atualizando...</span>
            </div>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {pendingStatus && (
        <StatusTransitionModal
          open={showTransitionModal}
          onClose={handleCancelChange}
          osId={osId}
          osTitulo={osTitulo}
          fromStatus={localStatus as StatusOS}
          toStatus={pendingStatus as StatusOS}
          onConfirm={handleConfirmChange}
        />
      )}
    </>
  )
}
