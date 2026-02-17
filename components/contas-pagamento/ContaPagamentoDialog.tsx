"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/useToast'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

const contaPagamentoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  tipoConta: z.string().optional(),
  titular: z.string().optional(),
  documento: z.string().optional(),
  chavePix: z.string().optional(),
  tipoChavePix: z.string().optional(),
  ativo: z.boolean().default(true),
  padrao: z.boolean().default(false),
  observacoes: z.string().optional(),
})

type ContaPagamentoFormData = z.infer<typeof contaPagamentoSchema>

interface ContaPagamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conta?: any
  onSuccess?: () => void
}

export function ContaPagamentoDialog({
  open,
  onOpenChange,
  conta,
  onSuccess,
}: ContaPagamentoDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ContaPagamentoFormData>({
    resolver: zodResolver(contaPagamentoSchema),
    defaultValues: {
      ativo: true,
      padrao: false,
    },
  })

  const tipoConta = watch('tipoConta')
  const tipoChavePix = watch('tipoChavePix')
  const ativo = watch('ativo')
  const padrao = watch('padrao')

  useEffect(() => {
    if (conta) {
      reset({
        nome: conta.nome || '',
        banco: conta.banco || '',
        agencia: conta.agencia || '',
        conta: conta.conta || '',
        tipoConta: conta.tipoConta || '',
        titular: conta.titular || '',
        documento: conta.documento || '',
        chavePix: conta.chavePix || '',
        tipoChavePix: conta.tipoChavePix || '',
        ativo: conta.ativo ?? true,
        padrao: conta.padrao ?? false,
        observacoes: conta.observacoes || '',
      })
    } else {
      reset({
        ativo: true,
        padrao: false,
      })
    }
  }, [conta, reset])

  const onSubmit = async (data: ContaPagamentoFormData) => {
    setLoading(true)
    try {
      const url = conta
        ? `/api/contas-pagamento/${conta.id}`
        : '/api/contas-pagamento'
      
      const response = await fetch(url, {
        method: conta ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar conta')
      }

      toast({
        title: conta ? 'Conta atualizada!' : 'Conta criada!',
        description: 'As informações foram salvas com sucesso',
        variant: 'success',
      })

      onSuccess?.()
      onOpenChange(false)
      reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar conta',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {conta ? 'Editar Conta de Pagamento' : 'Nova Conta de Pagamento'}
          </DialogTitle>
          <DialogDescription>
            Configure os dados bancários que serão exibidos nos invoices
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Conta *</Label>
            <Input
              id="nome"
              placeholder="Ex: Banco do Brasil - Conta Corrente"
              {...register('nome')}
            />
            {errors.nome && (
              <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="banco">Banco</Label>
              <Input
                id="banco"
                placeholder="Ex: Banco do Brasil"
                {...register('banco')}
              />
            </div>

            <div>
              <Label htmlFor="tipoConta">Tipo de Conta</Label>
              <Select
                value={tipoConta}
                onValueChange={(value) => setValue('tipoConta', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                  <SelectItem value="pagamento">Conta Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agencia">Agência</Label>
              <Input id="agencia" placeholder="0000" {...register('agencia')} />
            </div>

            <div>
              <Label htmlFor="conta">Número da Conta</Label>
              <Input id="conta" placeholder="00000-0" {...register('conta')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titular">Titular</Label>
              <Input id="titular" {...register('titular')} />
            </div>

            <div>
              <Label htmlFor="documento">CPF/CNPJ do Titular</Label>
              <Input id="documento" {...register('documento')} />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Informações PIX</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoChavePix">Tipo de Chave PIX</Label>
                <Select
                  value={tipoChavePix}
                  onValueChange={(value) => setValue('tipoChavePix', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chavePix">Chave PIX</Label>
                <Input id="chavePix" {...register('chavePix')} />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              rows={3}
              placeholder="Informações adicionais sobre esta conta"
              {...register('observacoes')}
            />
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={ativo}
                onCheckedChange={(checked) => setValue('ativo', !!checked)}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Conta Ativa
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="padrao"
                checked={padrao}
                onCheckedChange={(checked) => setValue('padrao', !!checked)}
              />
              <Label htmlFor="padrao" className="cursor-pointer">
                Conta Padrão
              </Label>
            </div>
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
              {conta ? 'Atualizar' : 'Criar'} Conta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
