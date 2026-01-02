'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AuditoriaDiffViewer } from './auditoria-diff-viewer'
import { formatarDataAuditoria } from '@/lib/utils/auditoria'
import {
  User,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react'

interface AuditoriaLog {
  id: string
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
    nome: string
    email: string
    roleGlobal: string
  }
}

interface Props {
  logs: AuditoriaLog[]
}

const acaoConfig: Record<
  string,
  { icon: any; color: string; bgColor: string; label: string }
> = {
  criar: {
    icon: Plus,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Criou',
  },
  atualizar: {
    icon: Edit,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Atualizou',
  },
  excluir: {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Excluiu',
  },
  visualizar: {
    icon: Eye,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Visualizou',
  },
  exportar: {
    icon: Download,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Exportou',
  },
  status_alterado: {
    icon: TrendingUp,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'Status Alterado',
  },
}

const entidadeLabels: Record<string, string> = {
  os: 'OS',
  participante: 'Participante',
  fornecedor_os: 'Fornecedor',
  atividade: 'Atividade',
  hospedagem: 'Hospedagem',
  transporte: 'Transporte',
  passagem_aerea: 'Passagem Aérea',
  guia_designacao: 'Guia',
  motorista_designacao: 'Motorista',
  scouting: 'Scouting',
  lancamento_financeiro: 'Lançamento',
  anotacao: 'Anotação',
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  agente: 'bg-blue-100 text-blue-800',
  guia: 'bg-green-100 text-green-800',
  motorista: 'bg-yellow-100 text-yellow-800',
  fornecedor: 'bg-orange-100 text-orange-800',
  cliente: 'bg-gray-100 text-gray-800',
}

export function AuditoriaTimeline({ logs }: Props) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const isExpanded = (logId: string) => expandedLogs.has(logId)

  return (
    <div className="space-y-4">
      {logs.map((log, index) => {
        const config = acaoConfig[log.acao] || acaoConfig.criar
        const Icon = config.icon
        const expanded = isExpanded(log.id)
        const hasDiff = log.dadosAntigos && log.dadosNovos

        return (
          <Card key={log.id} className="relative">
            {/* Linha vertical de conexão */}
            {index < logs.length - 1 && (
              <div className="absolute left-[51px] top-[60px] w-0.5 h-[calc(100%+16px)] bg-gray-200 -z-10" />
            )}

            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Ícone da ação */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{log.usuarioNome}</span>
                        <Badge variant="outline" className={roleColors[log.usuarioRole]}>
                          {log.usuarioRole}
                        </Badge>
                        <span className="text-muted-foreground">•</span>
                        <span className={config.color}>{config.label}</span>
                        <Badge variant="secondary">
                          {entidadeLabels[log.entidade] || log.entidade}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.descricao}
                      </p>
                    </div>

                    {/* Data/Hora */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                      <Clock className="w-4 h-4" />
                      {formatarDataAuditoria(new Date(log.createdAt))}
                    </div>
                  </div>

                  {/* Campos alterados */}
                  {log.campos && log.campos.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Campos alterados:
                      </span>
                      {log.campos.map((campo) => (
                        <Badge key={campo} variant="outline" className="text-xs">
                          {campo}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Botão expandir (se tiver diff) */}
                  {hasDiff && (
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Ocultar alterações
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Ver alterações
                        </>
                      )}
                    </button>
                  )}

                  {/* Diff Viewer (expandido) */}
                  {expanded && hasDiff && (
                    <div className="mt-4 border-t pt-4">
                      <AuditoriaDiffViewer
                        dadosAntigos={log.dadosAntigos}
                        dadosNovos={log.dadosNovos}
                        campos={log.campos}
                      />
                    </div>
                  )}

                  {/* Metadata (IP, User-Agent) */}
                  {expanded && log.metadata && (
                    <div className="mt-4 p-3 bg-gray-50 rounded text-xs space-y-1">
                      <p className="text-muted-foreground">
                        <strong>Metadata:</strong>
                      </p>
                      {log.metadata.ip && (
                        <p>
                          <strong>IP:</strong> {log.metadata.ip}
                        </p>
                      )}
                      {log.metadata.userAgent && (
                        <p>
                          <strong>User-Agent:</strong>{' '}
                          {log.metadata.userAgent.substring(0, 80)}...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
