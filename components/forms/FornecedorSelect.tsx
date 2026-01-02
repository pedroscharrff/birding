"use client"

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TipoFornecedor = 'hotelaria' | 'guiamento' | 'transporte' | 'alimentacao' | 'atividade' | 'outros'

interface Fornecedor {
  id: string
  nomeFantasia: string
  razaoSocial?: string
  tipo: TipoFornecedor
  email?: string
  telefone?: string
}

interface FornecedorSelectProps {
  tipo: TipoFornecedor
  value: string
  onChange: (fornecedorId: string) => void
  label?: string
  required?: boolean
  placeholder?: string
}

export function FornecedorSelect({
  tipo,
  value,
  onChange,
  label,
  required = false,
  placeholder = 'Selecione um fornecedor...',
}: FornecedorSelectProps) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchFornecedores()
  }, [tipo])

  const fetchFornecedores = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fornecedores?tipo=${tipo}`, {
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao buscar fornecedores')
      }

      setFornecedores(data.data)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao buscar fornecedores',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const tipoLabels: Record<TipoFornecedor, string> = {
    hotelaria: 'Hotelaria',
    guiamento: 'Guiamento',
    transporte: 'Transporte',
    alimentacao: 'Alimentação',
    atividade: 'Atividade',
    outros: 'Outros',
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {loading ? 'Carregando...' : placeholder}
          </option>
          {fornecedores.map((fornecedor) => (
            <option key={fornecedor.id} value={fornecedor.id}>
              {fornecedor.nomeFantasia}
              {fornecedor.razaoSocial && ` (${fornecedor.razaoSocial})`}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => window.open('/dashboard/fornecedores', '_blank')}
          title={`Cadastrar novo fornecedor de ${tipoLabels[tipo]}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {fornecedores.length === 0 && !loading && (
        <p className="text-sm text-amber-600 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Nenhum fornecedor de {tipoLabels[tipo].toLowerCase()} cadastrado.
          <button
            type="button"
            onClick={() => window.open('/dashboard/fornecedores', '_blank')}
            className="underline hover:text-amber-700"
          >
            Cadastre agora
          </button>
        </p>
      )}
    </div>
  )
}
