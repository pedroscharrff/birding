"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'

interface DespesaPagarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  osId: string
  despesa: {
    id: string
    tipo: 'hospedagem' | 'transporte' | 'atividade' | 'passagem_aerea'
    descricao: string
    valor: number
  } | null
  onSuccess?: () => void
}

export function DespesaPagarDialog({ open, onOpenChange, osId, despesa, onSuccess }: DespesaPagarDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comprovantes, setComprovantes] = useState<UploadedFile[]>([])
  const router = useRouter()

  const [formData, setFormData] = useState({
    dataPagamento: '',
    formaPagamento: 'pix',
    referenciaPagamento: '',
    statusPagamento: 'pago',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!despesa) return

    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        statusPagamento: formData.statusPagamento,
        dataPagamento: formData.dataPagamento || null,
        formaPagamento: formData.formaPagamento || null,
        referenciaPagamento: formData.referenciaPagamento || null,
        arquivos: comprovantes.length > 0 ? comprovantes : null,
      }

      const res = await fetch(`/api/os/${osId}/despesas/${despesa.tipo}/${despesa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao atualizar despesa')
      }

      onOpenChange(false)
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar despesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Marcar como Pago</DialogTitle>
          <DialogDescription>
            {despesa ? `${despesa.descricao} • Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valor)}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="referenciaPagamento">Referência</Label>
              <Input
                id="referenciaPagamento"
                placeholder="Ex: TXN123456, NF 001"
                value={formData.referenciaPagamento}
                onChange={(e) => setFormData({ ...formData, referenciaPagamento: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="statusPagamento">Status</Label>
              <Select value={formData.statusPagamento} onValueChange={(value) => setFormData({ ...formData, statusPagamento: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comprovantes de Pagamento</Label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                Anexe comprovantes de transferência, notas fiscais, recibos, etc.
              </p>
            </div>
            <FileUpload
              folder="pagamentos"
              entityId={despesa?.id || 'temp'}
              existingFiles={comprovantes}
              onFilesChange={setComprovantes}
              maxFiles={3}
              maxSizeMB={5}
              acceptedTypes={['application/pdf', 'image/*']}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !despesa}>
              {loading ? 'Salvando...' : 'Marcar' }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
