'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Filters {
  usuarioId?: string
  acao?: string
  entidade?: string
  dataInicio?: string
  dataFim?: string
}

interface Props {
  onFilterChange: (filters: Filters) => void
}

const acoesOptions = [
  { value: '', label: 'Todas as ações' },
  { value: 'criar', label: 'Criar' },
  { value: 'atualizar', label: 'Atualizar' },
  { value: 'excluir', label: 'Excluir' },
  { value: 'visualizar', label: 'Visualizar' },
  { value: 'exportar', label: 'Exportar' },
  { value: 'status_alterado', label: 'Status Alterado' },
]

const entidadesOptions = [
  { value: '', label: 'Todas as entidades' },
  { value: 'os', label: 'OS' },
  { value: 'participante', label: 'Participante' },
  { value: 'atividade', label: 'Atividade' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'passagem_aerea', label: 'Passagem Aérea' },
  { value: 'fornecedor_os', label: 'Fornecedor' },
  { value: 'guia_designacao', label: 'Guia' },
  { value: 'motorista_designacao', label: 'Motorista' },
  { value: 'scouting', label: 'Scouting' },
  { value: 'lancamento_financeiro', label: 'Lançamento Financeiro' },
  { value: 'anotacao', label: 'Anotação' },
]

export function AuditoriaFilters({ onFilterChange }: Props) {
  const [acao, setAcao] = useState('')
  const [entidade, setEntidade] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const hasActiveFilters = acao || entidade || dataInicio || dataFim

  const handleApplyFilters = () => {
    const filters: Filters = {}
    if (acao) filters.acao = acao
    if (entidade) filters.entidade = entidade
    if (dataInicio) filters.dataInicio = dataInicio
    if (dataFim) filters.dataFim = dataFim

    onFilterChange(filters)
  }

  const handleClearFilters = () => {
    setAcao('')
    setEntidade('')
    setDataInicio('')
    setDataFim('')
    onFilterChange({})
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ação */}
        <div>
          <label className="block text-sm font-medium mb-1">Ação</label>
          <select
            value={acao}
            onChange={(e) => setAcao(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {acoesOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Entidade */}
        <div>
          <label className="block text-sm font-medium mb-1">Entidade</label>
          <select
            value={entidade}
            onChange={(e) => setEntidade(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {entidadesOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Data Início */}
        <div>
          <label className="block text-sm font-medium mb-1">Data Início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Data Fim */}
        <div>
          <label className="block text-sm font-medium mb-1">Data Fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  )
}
