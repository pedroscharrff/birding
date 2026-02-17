"use client"

import { useState } from 'react'
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
import { useToast } from '@/hooks/useToast'
import { Loader2, Send } from 'lucide-react'

const sendEmailSchema = z.object({
  email: z.string().email('E-mail inválido'),
  mensagem: z.string().optional(),
})

type SendEmailFormData = z.infer<typeof sendEmailSchema>

interface SendInvoiceEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  defaultEmail?: string
  onSuccess?: () => void
}

export function SendInvoiceEmailDialog({
  open,
  onOpenChange,
  invoiceId,
  defaultEmail,
  onSuccess,
}: SendInvoiceEmailDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SendEmailFormData>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: {
      email: defaultEmail || '',
      mensagem: 'Segue em anexo o invoice solicitado.\n\nQualquer dúvida, estamos à disposição.',
    },
  })

  const onSubmit = async (data: SendEmailFormData) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar email')
      }

      toast({
        title: 'Email enviado!',
        description: 'O invoice foi enviado com sucesso',
        variant: 'success',
      })

      onSuccess?.()
      onOpenChange(false)
      reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Invoice por Email
          </DialogTitle>
          <DialogDescription>
            O invoice será enviado para o email especificado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email do Destinatário *</Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@exemplo.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mensagem">Mensagem (opcional)</Label>
            <Textarea
              id="mensagem"
              rows={5}
              placeholder="Digite uma mensagem personalizada..."
              {...register('mensagem')}
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
              <Send className="mr-2 h-4 w-4" />
              Enviar Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
