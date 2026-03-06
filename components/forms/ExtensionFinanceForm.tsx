"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, Loader2 } from 'lucide-react'

interface ExtensionFinanceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  extension: {
    id: string
    osId: string
    nome: string
    valorVenda?: number | null
    moedaVenda?: string
    valorRecebido?: number | null
    custoEstimado?: number | null
    custoReal?: number | null
    margemEstimada?: number | null
    obsFinanceiras?: string | null
  }
  onSuccess?: () => void
}

export function ExtensionFinanceForm({
  open,
  onOpenChange,
  extension,
  onSuccess,
}: ExtensionFinanceFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    valorVenda: extension.valorVenda?.toString() || '',
    moedaVenda: extension.moedaVenda || 'BRL',
    valorRecebido: extension.valorRecebido?.toString() || '',
    custoEstimado: extension.custoEstimado?.toString() || '',
    custoReal: extension.custoReal?.toString() || '',
    margemEstimada: extension.margemEstimada?.toString() || '',
    obsFinanceiras: extension.obsFinanceiras || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/os/${extension.osId}/extensoes/${extension.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valorVenda: formData.valorVenda ? parseFloat(formData.valorVenda) : null,
          moedaVenda: formData.moedaVenda,
          valorRecebido: formData.valorRecebido ? parseFloat(formData.valorRecebido) : null,
          custoEstimado: formData.custoEstimado ? parseFloat(formData.custoEstimado) : null,
          custoReal: formData.custoReal ? parseFloat(formData.custoReal) : null,
          margemEstimada: formData.margemEstimada ? parseFloat(formData.margemEstimada) : null,
          obsFinanceiras: formData.obsFinanceiras || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar dados financeiros')
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  const calcularMargem = () => {
    const venda = parseFloat(formData.valorVenda) || 0
    const custo = parseFloat(formData.custoReal || formData.custoEstimado) || 0
    const margem = venda - custo
    const percentual = venda > 0 ? (margem / venda) * 100 : 0
    return { margem, percentual }
  }

  const { margem, percentual } = calcularMargem()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Dados Financeiros - {extension.nome}
          </DialogTitle>
          <DialogDescription>
            Configure os valores financeiros específicos desta extensão
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Valor de Venda */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorVenda">Valor de Venda</Label>
              <Input
                id="valorVenda"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valorVenda}
                onChange={(e) => setFormData({ ...formData, valorVenda: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moedaVenda">Moeda</Label>
              <Select
                value={formData.moedaVenda}
                onValueChange={(value) => setFormData({ ...formData, moedaVenda: value })}
              >
                <SelectTrigger id="moedaVenda">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor Recebido */}
          <div className="space-y-2">
            <Label htmlFor="valorRecebido">Valor Recebido</Label>
            <Input
              id="valorRecebido"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.valorRecebido}
              onChange={(e) => setFormData({ ...formData, valorRecebido: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Valor já recebido do cliente para esta extensão
            </p>
          </div>

          {/* Custos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custoEstimado">Custo Estimado</Label>
              <Input
                id="custoEstimado"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.custoEstimado}
                onChange={(e) => setFormData({ ...formData, custoEstimado: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custoReal">Custo Real</Label>
              <Input
                id="custoReal"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.custoReal}
                onChange={(e) => setFormData({ ...formData, custoReal: e.target.value })}
              />
            </div>
          </div>

          {/* Margem Calculada */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium mb-2">Margem Calculada</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Valor</p>
                <p className={`text-lg font-bold ${margem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: formData.moedaVenda }).format(margem)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Percentual</p>
                <p className={`text-lg font-bold ${percentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {percentual.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Margem Estimada (Manual) */}
          <div className="space-y-2">
            <Label htmlFor="margemEstimada">Margem Estimada (%) - Opcional</Label>
            <Input
              id="margemEstimada"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.margemEstimada}
              onChange={(e) => setFormData({ ...formData, margemEstimada: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Deixe em branco para usar o cálculo automático
            </p>
          </div>

          {/* Observações Financeiras */}
          <div className="space-y-2">
            <Label htmlFor="obsFinanceiras">Observações Financeiras</Label>
            <Textarea
              id="obsFinanceiras"
              placeholder="Notas sobre pagamentos, condições especiais, etc."
              rows={4}
              value={formData.obsFinanceiras}
              onChange={(e) => setFormData({ ...formData, obsFinanceiras: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Dados Financeiros
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
