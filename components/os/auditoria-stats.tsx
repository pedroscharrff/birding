'use client'

import { Card } from '@/components/ui/card'
import { Activity, Clock, Users, Database } from 'lucide-react'

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

interface Props {
  stats: AuditoriaStats
}

const entidadeLabels: Record<string, string> = {
  os: 'OS',
  participante: 'Participantes',
  fornecedor_os: 'Fornecedores',
  atividade: 'Atividades',
  hospedagem: 'Hospedagens',
  transporte: 'Transportes',
  passagem_aerea: 'Passagens Aéreas',
  guia_designacao: 'Guias',
  motorista_designacao: 'Motoristas',
  scouting: 'Scoutings',
  lancamento_financeiro: 'Lançamentos',
  anotacao: 'Anotações',
}

export function AuditoriaStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Ações */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Ações</p>
            <p className="text-2xl font-bold">{stats.totalAcoes}</p>
          </div>
        </div>
      </Card>

      {/* Últimas 24h */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Últimas 24h</p>
            <p className="text-2xl font-bold">{stats.acoesUltimas24h}</p>
          </div>
        </div>
      </Card>

      {/* Usuários Mais Ativos */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mais Ativos</p>
          </div>
        </div>
        <div className="space-y-1">
          {stats.usuariosMaisAtivos.slice(0, 3).map((usuario, index) => (
            <div key={usuario.usuarioId} className="flex items-center justify-between text-sm">
              <span className="truncate flex-1">
                {index + 1}. {usuario.usuarioNome}
              </span>
              <span className="text-muted-foreground ml-2">
                {usuario.quantidade}
              </span>
            </div>
          ))}
          {stats.usuariosMaisAtivos.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Sem dados</p>
          )}
        </div>
      </Card>

      {/* Entidades Mais Alteradas */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Database className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mais Alteradas</p>
          </div>
        </div>
        <div className="space-y-1">
          {stats.entidadesMaisAlteradas.slice(0, 3).map((item, index) => (
            <div key={item.entidade} className="flex items-center justify-between text-sm">
              <span className="truncate flex-1">
                {index + 1}. {entidadeLabels[item.entidade] || item.entidade}
              </span>
              <span className="text-muted-foreground ml-2">
                {item.quantidade}
              </span>
            </div>
          ))}
          {stats.entidadesMaisAlteradas.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Sem dados</p>
          )}
        </div>
      </Card>
    </div>
  )
}
