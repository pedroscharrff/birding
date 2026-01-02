"use client"

/**
 * Modal de Transição de Status
 *
 * Exibe checklist de validação antes de permitir mudança de status de uma OS.
 * Integra com a API de validação para garantir que todos os requisitos sejam atendidos.
 */

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import type { StatusOS } from '@prisma/client'

interface ChecklistItem {
  id: string
  categoria: string
  descricao: string
  status: 'ok' | 'blocker' | 'warning'
  obrigatorio: boolean
  detalhes?: string
}

interface ValidationResult {
  canProceed: boolean
  blockers: ChecklistItem[]
  warnings: ChecklistItem[]
  checks: ChecklistItem[]
}

interface StatusTransitionModalProps {
  open: boolean
  onClose: () => void
  osId: string
  osTitulo: string
  fromStatus: StatusOS
  toStatus: StatusOS
  onConfirm: (justificativa?: string) => Promise<void>
}

export function StatusTransitionModal({
  open,
  onClose,
  osId,
  osTitulo,
  fromStatus,
  toStatus,
  onConfirm,
}: StatusTransitionModalProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showForceOption, setShowForceOption] = useState(false)
  const [justificativa, setJustificativa] = useState('')

  // Buscar validação quando o modal abrir
  React.useEffect(() => {
    if (open && !validation) {
      validateTransition()
    }
  }, [open])

  const validateTransition = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/os/${osId}/validate-transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromStatus, toStatus }),
      })

      if (!response.ok) {
        throw new Error('Erro ao validar transição')
      }

      const data = await response.json()
      setValidation(data)
    } catch (error) {
      console.error('Erro ao validar transição:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!validation?.canProceed && !showForceOption) {
      setShowForceOption(true)
      return
    }

    setConfirming(true)
    try {
      await onConfirm(showForceOption ? justificativa : undefined)
      onClose()
    } catch (error) {
      console.error('Erro ao confirmar transição:', error)
    } finally {
      setConfirming(false)
    }
  }

  const handleCancel = () => {
    setValidation(null)
    setShowForceOption(false)
    setJustificativa('')
    onClose()
  }

  const statusLabels: Record<StatusOS, string> = {
    planejamento: 'Planejamento',
    cotacoes: 'Cotações',
    reservas_pendentes: 'Reservas Pendentes',
    reservas_confirmadas: 'Reservas Confirmadas',
    documentacao: 'Documentação',
    pronto_para_viagem: 'Pronto para Viagem',
    em_andamento: 'Em Andamento',
    concluida: 'Concluída',
    pos_viagem: 'Pós-Viagem',
    cancelada: 'Cancelada',
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mudança de Status</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{osTitulo}</span>
            <br />
            De <span className="font-medium">{statusLabels[fromStatus]}</span> para{' '}
            <span className="font-medium">{statusLabels[toStatus]}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : validation ? (
          <div className="space-y-4">
            {/* Blockers */}
            {validation.blockers.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Problemas Críticos ({validation.blockers.length})
                </h3>
                {validation.blockers.map((item) => (
                  <ChecklistItemCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Avisos ({validation.warnings.length})
                </h3>
                {validation.warnings.map((item) => (
                  <ChecklistItemCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Checks OK */}
            {validation.checks.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Verificações OK ({validation.checks.length})
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {validation.checks.map((item) => (
                    <ChecklistItemCard key={item.id} item={item} compact />
                  ))}
                </div>
              </div>
            )}

            {/* Opção de forçar com justificativa */}
            {showForceOption && !validation.canProceed && (
              <div className="border-t pt-4 space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Atenção: Você está prestes a forçar uma mudança de status mesmo com problemas críticos.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Esta ação será registrada na auditoria.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Justificativa (obrigatória)
                  </label>
                  <Textarea
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    placeholder="Explique o motivo de forçar esta mudança de status..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Erro ao carregar validação
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={confirming}>
            Cancelar
          </Button>

          {validation?.canProceed ? (
            <Button onClick={handleConfirm} disabled={confirming}>
              {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Mudança
            </Button>
          ) : showForceOption ? (
            <Button
              onClick={handleConfirm}
              disabled={confirming || !justificativa.trim()}
              variant="destructive"
            >
              {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Forçar Mudança
            </Button>
          ) : (
            <Button onClick={() => setShowForceOption(true)} variant="destructive">
              Forçar com Justificativa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ChecklistItemCardProps {
  item: ChecklistItem
  compact?: boolean
}

function ChecklistItemCard({ item, compact = false }: ChecklistItemCardProps) {
  const statusConfig = {
    ok: {
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
    },
    blocker: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
  }

  const config = statusConfig[item.status]
  const Icon = config.icon

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded ${config.bgColor}`}>
        <Icon className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
        <span className={`text-sm ${config.textColor}`}>{item.descricao}</span>
      </div>
    )
  }

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-medium ${config.textColor}`}>
                {item.categoria}
              </p>
              <p className={`text-sm mt-0.5 ${config.textColor} opacity-90`}>
                {item.descricao}
              </p>
              {item.detalhes && (
                <p className="text-xs mt-1 opacity-75">
                  {item.detalhes}
                </p>
              )}
            </div>
            {item.obrigatorio && (
              <span className="text-xs bg-white px-2 py-0.5 rounded font-medium whitespace-nowrap">
                Obrigatório
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
