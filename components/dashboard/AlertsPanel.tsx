"use client"

/**
 * Painel de Alertas Inteligentes
 * 
 * Exibe alertas críticos, avisos e informativos
 * para prevenir erros e esquecimentos.
 */

import { Alert, AlertsCount } from '@/types/alerts'
import { AlertTriangle, AlertCircle, Info, X, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AlertsPanelProps {
  alerts: Alert[]
  count: AlertsCount
  onDismiss?: (alertId: string) => void
}

export function AlertsPanel({ alerts, count, onDismiss }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-green-500" />
            Tudo em ordem!
          </CardTitle>
          <CardDescription>
            Nenhum alerta no momento. Continue assim!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Alertas e Notificações</span>
          <div className="flex gap-2">
            {count.critical > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {count.critical} crítico{count.critical > 1 ? 's' : ''}
              </Badge>
            )}
            {count.warning > 0 && (
              <Badge variant="warning" className="gap-1 bg-yellow-500 text-white">
                <AlertCircle className="h-3 w-3" />
                {count.warning} aviso{count.warning > 1 ? 's' : ''}
              </Badge>
            )}
            {count.info > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Info className="h-3 w-3" />
                {count.info}
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          {count.total} alerta{count.total > 1 ? 's' : ''} requer{count.total === 1 ? '' : 'em'} atenção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface AlertItemProps {
  alert: Alert
  onDismiss?: (alertId: string) => void
}

function AlertItem({ alert, onDismiss }: AlertItemProps) {
  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
    },
  }

  const config = severityConfig[alert.severity]
  const Icon = config.icon

  return (
    <div
      className={`relative p-4 rounded-lg border-2 ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`font-semibold text-sm ${config.textColor}`}>
                {alert.title}
              </h4>
              <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>
                {alert.description}
              </p>
              
              {alert.osTitulo && (
                <p className="text-xs mt-2 opacity-75">
                  OS: <span className="font-medium">{alert.osTitulo}</span>
                </p>
              )}
            </div>

            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onDismiss(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {alert.actionUrl && alert.actionLabel && (
            <Link href={alert.actionUrl}>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-8"
              >
                {alert.actionLabel}
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente compacto para exibir apenas o resumo
export function AlertsSummary({ count }: { count: AlertsCount }) {
  if (count.total === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Info className="h-4 w-4" />
        <span>Tudo em ordem</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {count.critical > 0 && (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {count.critical}
        </Badge>
      )}
      {count.warning > 0 && (
        <Badge variant="warning" className="gap-1 bg-yellow-500 text-white">
          <AlertCircle className="h-3 w-3" />
          {count.warning}
        </Badge>
      )}
      {count.info > 0 && (
        <Badge variant="secondary" className="gap-1">
          <Info className="h-3 w-3" />
          {count.info}
        </Badge>
      )}
    </div>
  )
}
