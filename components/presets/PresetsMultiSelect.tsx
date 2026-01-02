"use client"

import { useMemo, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useApi } from '@/hooks/useApi'
import { X, Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type PresetTipo = 'alergia' | 'restricao' | 'preferencia'

interface PresetCategory {
  id: string
  nome: string
  tipo: PresetTipo
  parentId?: string | null
}

interface PresetItem {
  id: string
  label: string
  tipo: PresetTipo
  categoriaId?: string | null
  ativo: boolean
}

interface PresetsMultiSelectProps {
  id: string
  label: string
  placeholder?: string
  tipo: PresetTipo
  value: string
  onChange: (value: string) => void
}

export function PresetsMultiSelect({ id, label, placeholder, tipo, value, onChange }: PresetsMultiSelectProps) {
  const [query, setQuery] = useState('')
  const selected = useMemo(() =>
    new Set(value.split(',').map(v => v.trim()).filter(Boolean)), [value])

  const { data: categoriesData, refetch: refetchCategories } = useApi<PresetCategory[]>(`/api/config/presets/categories?tipo=${tipo}`)
  const { data: itemsData, refetch: refetchItems } = useApi<PresetItem[]>(`/api/config/presets/items?tipo=${tipo}&ativo=true`)

  useEffect(() => {
    // ensures we have fresh data if component remounts
    refetchCategories()
    refetchItems()
  }, [refetchCategories, refetchItems])

  const categoriesById = useMemo(() => {
    const map = new Map<string, PresetCategory>()
    ;(categoriesData || []).forEach(c => map.set(c.id, c))
    return map
  }, [categoriesData])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = (itemsData || []).filter(i => i.ativo)
    return q ? items.filter(i => i.label.toLowerCase().includes(q)) : items
  }, [itemsData, query])

  const grouped: Record<string, PresetItem[]> = useMemo(() => {
    const groups: Record<string, PresetItem[]> = {}
    for (const item of filteredItems) {
      const cat = item.categoriaId ? categoriesById.get(item.categoriaId)?.nome || 'Sem categoria' : 'Sem categoria'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    // sort groups by category name and items by label
    Object.keys(groups).forEach(k => groups[k].sort((a,b) => a.label.localeCompare(b.label)))
    return Object.fromEntries(Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])))
  }, [filteredItems, categoriesById])

  const toggle = (label: string) => {
    const set = new Set(selected)
    if (set.has(label)) set.delete(label)
    else set.add(label)
    onChange(Array.from(set).sort((a,b) => a.localeCompare(b)).join(', '))
  }

  const addFreeText = (text: string) => {
    const t = text.trim()
    if (!t) return
    const set = new Set(selected)
    set.add(t)
    onChange(Array.from(set).sort((a,b) => a.localeCompare(b)).join(', '))
    setQuery('')
  }

  // Cores por tipo
  const getColorClasses = (isSelected: boolean) => {
    if (tipo === 'alergia') {
      return isSelected 
        ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' 
        : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
    }
    if (tipo === 'restricao') {
      return isSelected 
        ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200' 
        : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50'
    }
    // preferencia
    return isSelected 
      ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' 
      : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="text-base font-semibold">{label}</Label>
      
      {/* Campo de busca/adição */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id={id}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addFreeText(query)
            }
          }}
          placeholder={placeholder || 'Buscar ou adicionar (pressione Enter)'}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => addFreeText(query)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
            title="Adicionar"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Itens selecionados */}
      {value && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Selecionados ({selected.size})
          </div>
          <div className="mt-1 pl-0.5 flex flex-wrap gap-2">
            {Array.from(selected).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => toggle(v)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border-2 transition-all cursor-pointer',
                  getColorClasses(true),
                  'hover:scale-105'
                )}
              >
                {v}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opções disponíveis */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Opções Disponíveis
          </div>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-2">
              <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span>{cat}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="pl-0.5 flex flex-wrap gap-2">
                {items.map(item => {
                  const isSelected = selected.has(item.label)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(item.label)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border-2 transition-all cursor-pointer',
                        getColorClasses(isSelected),
                        isSelected ? 'ring-2 ring-offset-2' : '',
                        isSelected && tipo === 'alergia' && 'ring-red-400',
                        isSelected && tipo === 'restricao' && 'ring-orange-400',
                        isSelected && tipo === 'preferencia' && 'ring-blue-400',
                        'hover:scale-105'
                      )}
                    >
                      {item.label}
                      {isSelected && <X className="h-3.5 w-3.5" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem quando não há opções */}
      {Object.keys(grouped).length === 0 && !query && (
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>Nenhuma opção disponível ainda.</p>
          <p className="mt-1">Digite acima e pressione Enter para adicionar.</p>
        </div>
      )}

      {/* Mensagem quando busca não retorna resultados */}
      {Object.keys(grouped).length === 0 && query && (
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>Nenhum resultado para "{query}"</p>
          <p className="mt-1">Pressione Enter para adicionar como novo item.</p>
        </div>
      )}
    </div>
  )
}
