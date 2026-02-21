"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { formatDateForInput } from "@/lib/utils/date"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/useToast"
import { Trash2 } from "lucide-react"

const extensionSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  dataFim: z.string().min(1, "Data de fim é obrigatória"),
  descricao: z.string().optional(),
  status: z.string().optional(),
})

type ExtensionInput = z.infer<typeof extensionSchema>

interface OSExtensionManagerProps {
  osId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingExtension?: any // Se passado, estamos editando
}

export function OSExtensionManager({
  osId,
  open,
  onOpenChange,
  onSuccess,
  editingExtension
}: OSExtensionManagerProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ExtensionInput>({
    resolver: zodResolver(extensionSchema),
    defaultValues: {
      nome: '',
      dataInicio: '',
      dataFim: '',
      descricao: '',
      status: 'planejamento',
    },
  })

  useEffect(() => {
    if (open) {
      if (editingExtension) {
        reset({
          nome: editingExtension.nome,
          dataInicio: editingExtension.dataInicio ? formatDateForInput(editingExtension.dataInicio) : '',
          dataFim: editingExtension.dataFim ? formatDateForInput(editingExtension.dataFim) : '',
          descricao: editingExtension.descricao || '',
          status: editingExtension.status || 'planejamento',
        })
      } else {
        reset({
          nome: '',
          dataInicio: '',
          dataFim: '',
          descricao: '',
          status: 'planejamento',
        })
      }
    }
  }, [editingExtension, open, reset])

  async function onSubmit(values: ExtensionInput) {
    setLoading(true)
    try {
      const url = editingExtension 
        ? `/api/os/${osId}/extensoes/${editingExtension.id}`
        : `/api/os/${osId}/extensoes`
      
      const method = editingExtension ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao salvar extensão')
      }

      toast({
        title: "Sucesso!",
        description: `Extensão ${editingExtension ? 'atualizada' : 'criada'} com sucesso`,
        variant: "success",
      })

      reset()
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editingExtension) return
    if (!confirm("Tem certeza que deseja excluir esta extensão?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/os/${osId}/extensoes/${editingExtension.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao excluir')

      toast({
        title: "Sucesso!",
        description: "Extensão removida",
        variant: "success",
      })
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a extensão",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingExtension ? 'Editar Extensão' : 'Nova Extensão'}</DialogTitle>
          <DialogDescription>
            Defina os detalhes desta parte da viagem (Ex: Pantanal, Amazônia)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Extensão *</Label>
            <Input
              id="nome"
              placeholder="Ex: Trecho Pantanal Norte"
              {...register("nome")}
            />
            {errors.nome && (
              <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planejamento">Planejamento</SelectItem>
                    <SelectItem value="cotacoes">Cotações</SelectItem>
                    <SelectItem value="reservas_pendentes">Reservas Pendentes</SelectItem>
                    <SelectItem value="reservas_confirmadas">Reservas Confirmadas</SelectItem>
                    <SelectItem value="documentacao">Documentação</SelectItem>
                    <SelectItem value="pronto_para_viagem">Pronto para Viagem</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="pos_viagem">Pós Viagem</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Informaçes adicionais sobre este trecho..."
              rows={3}
              {...register("descricao")}
            />
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {editingExtension && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
