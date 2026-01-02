"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/app/providers/AuthProvider"
import { Plus } from "lucide-react"

const createOSSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  destino: z.string().min(2, "Destino é obrigatório"),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  dataFim: z.string().min(1, "Data de fim é obrigatória"),
  descricao: z.string().optional(),
  status: z.enum([
    'planejamento',
    'cotacoes',
    'reservas_pendentes',
    'reservas_confirmadas',
    'documentacao',
    'pronto_para_viagem',
    'em_andamento',
    'concluida',
    'pos_viagem',
    'cancelada',
  ]).default('planejamento'),
})

type CreateOSInput = z.infer<typeof createOSSchema>

interface CreateOSDialogProps {
  onSuccess?: () => void
}

export function CreateOSDialog({ onSuccess }: CreateOSDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateOSInput>({
    resolver: zodResolver(createOSSchema),
    defaultValues: {
      status: 'planejamento',
    },
  })

  const status = watch('status')

  async function onSubmit(values: CreateOSInput) {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...values,
          agenteResponsavelId: user.id,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar OS')
      }

      toast({
        title: "Sucesso!",
        description: "Ordem de Serviço criada com sucesso",
        variant: "success",
      })

      reset()
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Erro ao criar OS",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova OS
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados básicos da operação. Você poderá adicionar participantes, hospedagens e outros detalhes depois.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="titulo">Título da Operação *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Tour Pantanal Sul"
                {...register("titulo")}
              />
              {errors.titulo && (
                <p className="text-sm text-red-600 mt-1">{errors.titulo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="destino">Destino *</Label>
              <Input
                id="destino"
                placeholder="Ex: Bonito, MS"
                {...register("destino")}
              />
              {errors.destino && (
                <p className="text-sm text-red-600 mt-1">{errors.destino.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status Inicial</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planejamento">Planejamento</SelectItem>
                  <SelectItem value="cotacoes">Cotações</SelectItem>
                  <SelectItem value="reservas_pendentes">Reservas Pendentes</SelectItem>
                  <SelectItem value="reservas_confirmadas">Reservas Confirmadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dataInicio">Data Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                {...register("dataInicio")}
              />
              {errors.dataInicio && (
                <p className="text-sm text-red-600 mt-1">{errors.dataInicio.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dataFim">Data Fim *</Label>
              <Input
                id="dataFim"
                type="date"
                {...register("dataFim")}
              />
              {errors.dataFim && (
                <p className="text-sm text-red-600 mt-1">{errors.dataFim.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="descricao">Descrição (Opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva a operação..."
                rows={3}
                {...register("descricao")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Ordem de Serviço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
