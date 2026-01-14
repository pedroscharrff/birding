"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface Pagamento {
  id: string
  descricao: string
  valor: number
  moeda?: string
  dataVencimento: Date
  dataPagamento?: Date | null
  status: string
  percentualParcial?: number | null
  formaPagamento?: string | null
  referencia?: string | null
  comprovanteUrl?: string | null
  fornecedorId?: string | null
  observacoes?: string | null
  fornecedor?: {
    id: string
    nomeFantasia: string
  } | null
}

interface PagamentoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  osId: string
  tipo: 'entrada' | 'saida'
  fornecedores?: Array<{ id: string; nomeFantasia: string }>
  pagamento?: Pagamento | null
  onSuccess?: () => void
}

export function PagamentoForm({ open, onOpenChange, osId, tipo, fornecedores = [], pagamento, onSuccess }: PagamentoFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!pagamento

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    moeda: 'BRL',
    dataVencimento: '',
    dataPagamento: '',
    status: 'pendente',
    percentualParcial: '',
    formaPagamento: '',
    referencia: '',
    comprovanteUrl: '',
    fornecedorId: '',
    observacoes: '',
  })

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (pagamento) {
      setFormData({
        descricao: pagamento.descricao || '',
        valor: pagamento.valor?.toString() || '',
        moeda: pagamento.moeda || 'BRL',
        dataVencimento: pagamento.dataVencimento ? new Date(pagamento.dataVencimento).toISOString().split('T')[0] : '',
        dataPagamento: pagamento.dataPagamento ? new Date(pagamento.dataPagamento).toISOString().split('T')[0] : '',
        status: pagamento.status || 'pendente',
        percentualParcial: pagamento.percentualParcial?.toString() || '',
        formaPagamento: pagamento.formaPagamento || '',
        referencia: pagamento.referencia || '',
        comprovanteUrl: pagamento.comprovanteUrl || '',
        fornecedorId: pagamento.fornecedorId || '',
        observacoes: pagamento.observacoes || '',
      })
    } else {
      setFormData({
        descricao: '',
        valor: '',
        moeda: 'BRL',
        dataVencimento: '',
        dataPagamento: '',
        status: 'pendente',
        percentualParcial: '',
        formaPagamento: '',
        referencia: '',
        comprovanteUrl: '',
        fornecedorId: '',
        observacoes: '',
      })
    }
  }, [pagamento])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        moeda: formData.moeda,
        dataVencimento: formData.dataVencimento,
        status: formData.status,
      }

      // Adicionar tipo apenas se estiver criando
      if (!isEditing) {
        payload.tipo = tipo
      }

      if (formData.dataPagamento) {
        payload.dataPagamento = formData.dataPagamento
      }
      if (formData.percentualParcial) {
        payload.percentualParcial = parseFloat(formData.percentualParcial)
      }
      if (formData.formaPagamento) {
        payload.formaPagamento = formData.formaPagamento
      }
      if (formData.referencia) {
        payload.referencia = formData.referencia
      }
      if (formData.comprovanteUrl) {
        payload.comprovanteUrl = formData.comprovanteUrl
      }
      if (formData.fornecedorId) {
        payload.fornecedorId = formData.fornecedorId
      }
      if (formData.observacoes) {
        payload.observacoes = formData.observacoes
      }

      const url = isEditing
        ? `/api/os/${osId}/pagamentos/${pagamento.id}`
        : `/api/os/${osId}/pagamentos`
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento')
      }

      // Reset form
      if (!isEditing) {
        setFormData({
          descricao: '',
          valor: '',
          moeda: 'BRL',
          dataVencimento: '',
          dataPagamento: '',
          status: 'pendente',
          percentualParcial: '',
          formaPagamento: '',
          referencia: '',
          comprovanteUrl: '',
          fornecedorId: '',
          observacoes: '',
        })
      }

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? (tipo === 'entrada' ? 'Editar Recebimento' : 'Editar Pagamento')
              : (tipo === 'entrada' ? 'Adicionar Recebimento' : 'Adicionar Pagamento')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informações do pagamento'
              : (tipo === 'entrada'
                  ? 'Cadastre uma parcela ou recebimento do cliente'
                  : 'Cadastre um pagamento a fornecedor')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="descricao">
                Descrição <span className="text-red-500">*</span>
              </Label>
              <Input
                id="descricao"
                placeholder={tipo === 'entrada' ? 'Ex: Entrada - 30%' : 'Ex: Pagamento Hotel XYZ'}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="valor">
                Valor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="moeda">Moeda</Label>
              <Select value={formData.moeda} onValueChange={(value) => setFormData({ ...formData, moeda: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dataVencimento">
                Data de Vencimento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'parcial' && (
              <div>
                <Label htmlFor="percentualParcial">
                  Percentual do Pagamento (%)
                </Label>
                <Input
                  id="percentualParcial"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ex: 30 para 30%"
                  value={formData.percentualParcial}
                  onChange={(e) => setFormData({ ...formData, percentualParcial: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Informe a porcentagem que este pagamento representa do total
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="dataPagamento">Data de Pagamento</Label>
              <Input
                id="dataPagamento"
                type="date"
                value={formData.dataPagamento}
                onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
              <Select value={formData.formaPagamento} onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="deposito">Depósito</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipo === 'saida' && fornecedores.length > 0 && (
              <div>
                <Label htmlFor="fornecedorId">Fornecedor</Label>
                <Select value={formData.fornecedorId} onValueChange={(value) => setFormData({ ...formData, fornecedorId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nomeFantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="referencia">Referência/Número</Label>
              <Input
                id="referencia"
                placeholder="Ex: TXN123456, Nota Fiscal 001"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="comprovanteUrl">URL do Comprovante</Label>
              <Input
                id="comprovanteUrl"
                type="url"
                placeholder="https://..."
                value={formData.comprovanteUrl}
                onChange={(e) => setFormData({ ...formData, comprovanteUrl: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
