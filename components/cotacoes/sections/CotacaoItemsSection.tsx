"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { FornecedorSelect } from "@/components/forms/FornecedorSelect"
import { TarifaSelect } from "@/components/forms/TarifaSelect"

export interface CotacaoItem {
  id: string
  fornecedorId?: string
  tarifaId?: string
  descricao: string
  quantidade: number
  valorUnitario: number
  moeda: string
  subtotal: number
  observacoes?: string
}

interface CotacaoItemsSectionProps {
  items: CotacaoItem[]
  onChange: (items: CotacaoItem[]) => void
  sectionTitle: string
  quantityLabel?: string
  quantityPlaceholder?: string
  tipoFornecedor: 'hotelaria' | 'guiamento' | 'transporte' | 'alimentacao' | 'atividade' | 'outros'
}

export function CotacaoItemsSection({
  items,
  onChange,
  sectionTitle,
  quantityLabel = "Quantidade",
  quantityPlaceholder = "Ex: 1",
  tipoFornecedor,
}: CotacaoItemsSectionProps) {
  const [editingItem, setEditingItem] = useState<Partial<CotacaoItem>>({
    fornecedorId: "",
    tarifaId: "",
    descricao: "",
    quantidade: 1,
    valorUnitario: 0,
    moeda: "BRL",
    subtotal: 0,
  })

  const handleAddItem = () => {
    if (!editingItem.descricao || !editingItem.quantidade || !editingItem.valorUnitario) {
      return
    }

    const newItem: CotacaoItem = {
      id: Math.random().toString(36).substr(2, 9),
      fornecedorId: editingItem.fornecedorId,
      tarifaId: editingItem.tarifaId,
      descricao: editingItem.descricao,
      quantidade: editingItem.quantidade,
      valorUnitario: editingItem.valorUnitario,
      moeda: editingItem.moeda || "BRL",
      subtotal: editingItem.quantidade * editingItem.valorUnitario,
      observacoes: editingItem.observacoes,
    }

    onChange([...items, newItem])
    
    setEditingItem({
      fornecedorId: "",
      tarifaId: "",
      descricao: "",
      quantidade: 1,
      valorUnitario: 0,
      moeda: "BRL",
      subtotal: 0,
    })
  }

  const handleRemoveItem = (id: string) => {
    onChange(items.filter(item => item.id !== id))
  }

  const handleFieldChange = (field: keyof CotacaoItem, value: any) => {
    const updated = { ...editingItem, [field]: value }
    
    if (field === "quantidade" || field === "valorUnitario") {
      const quantidade = field === "quantidade" ? Number(value) : (editingItem.quantidade || 0)
      const valorUnitario = field === "valorUnitario" ? Number(value) : (editingItem.valorUnitario || 0)
      updated.subtotal = quantidade * valorUnitario
    }
    
    setEditingItem(updated)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const totalSection = items.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{sectionTitle}</h4>
        {items.length > 0 && (
          <span className="text-sm text-gray-600">
            Total: <span className="font-semibold">{formatCurrency(totalSection)}</span>
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Descrição</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">{quantityLabel}</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Valor Unit.</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Subtotal</th>
                <th className="px-4 py-2 text-center font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">{item.descricao}</td>
                  <td className="px-4 py-2">{item.quantidade}</td>
                  <td className="px-4 py-2">{formatCurrency(item.valorUnitario)}</td>
                  <td className="px-4 py-2 font-medium">{formatCurrency(item.subtotal)}</td>
                  <td className="px-4 py-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
        <p className="text-sm font-medium text-gray-700">Adicionar novo item</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FornecedorSelect
              tipo={tipoFornecedor}
              value={editingItem.fornecedorId || ""}
              onChange={(fornecedorId) => {
                handleFieldChange("fornecedorId", fornecedorId)
                if (!fornecedorId) {
                  handleFieldChange("tarifaId", "")
                }
              }}
              label="Fornecedor (Opcional)"
              placeholder="Selecione um fornecedor..."
            />
          </div>

          {editingItem.fornecedorId && (
            <div>
              <TarifaSelect
                fornecedorId={editingItem.fornecedorId}
                value={editingItem.tarifaId || ""}
                onChange={(tarifaId, tarifa) => {
                  console.log('[CotacaoItemsSection] Tarifa selecionada:', { tarifaId, tarifa })
                  handleFieldChange("tarifaId", tarifaId)
                  if (tarifa) {
                    const valorNumerico = typeof tarifa.valor === 'string' ? parseFloat(tarifa.valor) : tarifa.valor
                    console.log('[CotacaoItemsSection] Preenchendo campos:', {
                      descricao: tarifa.descricao,
                      valor: valorNumerico,
                      moeda: tarifa.moeda
                    })
                    
                    setEditingItem(prev => ({
                      ...prev,
                      tarifaId,
                      descricao: tarifa.descricao,
                      valorUnitario: valorNumerico,
                      moeda: tarifa.moeda,
                      subtotal: (prev.quantidade || 1) * valorNumerico
                    }))
                  }
                }}
                label="Tarifa (Opcional)"
              />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5">
            <Label htmlFor="descricao" className="text-xs">Descrição *</Label>
            <Input
              id="descricao"
              placeholder="Ex: Hotel Fazenda - Quarto Duplo"
              value={editingItem.descricao || ""}
              onChange={(e) => handleFieldChange("descricao", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="quantidade" className="text-xs">{quantityLabel} *</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              placeholder={quantityPlaceholder}
              value={editingItem.quantidade || ""}
              onChange={(e) => handleFieldChange("quantidade", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="valorUnitario" className="text-xs">Valor Unit. *</Label>
            <Input
              id="valorUnitario"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={editingItem.valorUnitario || ""}
              onChange={(e) => handleFieldChange("valorUnitario", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="col-span-3">
            <Label htmlFor="observacoes" className="text-xs">Obs.</Label>
            <Input
              id="observacoes"
              placeholder="Observações..."
              value={editingItem.observacoes || ""}
              onChange={(e) => handleFieldChange("observacoes", e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="text-sm">
            <span className="text-gray-600">Subtotal: </span>
            <span className="font-semibold text-gray-900">{formatCurrency(editingItem.subtotal || 0)}</span>
          </div>
          <Button
            type="button"
            onClick={handleAddItem}
            disabled={!editingItem.descricao || !editingItem.quantidade || !editingItem.valorUnitario}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Nenhum item adicionado ainda. Use o formulário acima para adicionar.
        </p>
      )}
    </div>
  )
}
