"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/useToast"
import { Plus } from "lucide-react"
import { CotacaoHospedagensSection } from "../sections/CotacaoHospedagensSection"
import { CotacaoAtividadesSection } from "../sections/CotacaoAtividadesSection"
import { CotacaoTransportesSection } from "../sections/CotacaoTransportesSection"
import { CotacaoAlimentacaoSection } from "../sections/CotacaoAlimentacaoSection"

const createTemplateSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  categoria: z.string().min(2, "Categoria é obrigatória"),
  descricao: z.string().optional(),
  destino: z.string().optional(),
  duracaoDias: z.string().optional(),
})

type CreateTemplateInput = z.infer<typeof createTemplateSchema>

interface CreateTemplateDialogProps {
  onSuccess?: () => void
}

export function CreateTemplateDialog({ onSuccess }: CreateTemplateDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [hospedagens, setHospedagens] = useState<any[]>([])
  const [atividades, setAtividades] = useState<any[]>([])
  const [transportes, setTransportes] = useState<any[]>([])
  const [alimentacoes, setAlimentacoes] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
  })

  const calcularTotal = () => {
    const totalHospedagens = hospedagens.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const totalAtividades = atividades.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const totalTransportes = transportes.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    const totalAlimentacoes = alimentacoes.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    
    return {
      hospedagens: totalHospedagens,
      atividades: totalAtividades,
      transportes: totalTransportes,
      alimentacoes: totalAlimentacoes,
      total: totalHospedagens + totalAtividades + totalTransportes + totalAlimentacoes,
    }
  }

  async function onSubmit(values: CreateTemplateInput) {
    setLoading(true)
    try {
      const totais = calcularTotal()
      const totalItens = hospedagens.length + atividades.length + transportes.length + alimentacoes.length
      
      console.log("Dados do template:", {
        ...values,
        hospedagens,
        atividades,
        transportes,
        alimentacoes,
        totalItens,
        totais,
      })

      toast({
        title: "Sucesso!",
        description: "Template criado com sucesso (mock - API ainda não implementada)",
        variant: "success",
      })

      reset()
      setHospedagens([])
      setAtividades([])
      setTransportes([])
      setAlimentacoes([])
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Erro ao criar template",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totais = calcularTotal()
  const totalItens = hospedagens.length + atividades.length + transportes.length + alimentacoes.length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Template de Cotação</DialogTitle>
          <DialogDescription>
            Configure um template reutilizável com itens pré-definidos para agilizar suas cotações
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900">Informações do Template</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome do Template *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Pantanal Sul - 7 dias"
                  {...register("nome")}
                />
                {errors.nome && (
                  <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Input
                  id="categoria"
                  placeholder="Ex: Pantanal, Amazônia, Bonito"
                  {...register("categoria")}
                />
                {errors.categoria && (
                  <p className="text-sm text-red-600 mt-1">{errors.categoria.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="destino">Destino Padrão</Label>
                <Input
                  id="destino"
                  placeholder="Ex: Bonito, MS"
                  {...register("destino")}
                />
              </div>

              <div>
                <Label htmlFor="duracaoDias">Duração (dias)</Label>
                <Input
                  id="duracaoDias"
                  type="number"
                  placeholder="Ex: 7"
                  {...register("duracaoDias")}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o template e quando utilizá-lo..."
                  rows={2}
                  {...register("descricao")}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Itens do Template</h3>
            
            <Tabs defaultValue="hospedagens" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="hospedagens">
                  Hospedagens
                  {hospedagens.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {hospedagens.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="atividades">
                  Atividades
                  {atividades.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {atividades.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="transportes">
                  Transportes
                  {transportes.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {transportes.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="alimentacao">
                  Alimentação
                  {alimentacoes.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {alimentacoes.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hospedagens" className="mt-4">
                <CotacaoHospedagensSection
                  items={hospedagens}
                  onChange={setHospedagens}
                />
              </TabsContent>

              <TabsContent value="atividades" className="mt-4">
                <CotacaoAtividadesSection
                  items={atividades}
                  onChange={setAtividades}
                />
              </TabsContent>

              <TabsContent value="transportes" className="mt-4">
                <CotacaoTransportesSection
                  items={transportes}
                  onChange={setTransportes}
                />
              </TabsContent>

              <TabsContent value="alimentacao" className="mt-4">
                <CotacaoAlimentacaoSection
                  items={alimentacoes}
                  onChange={setAlimentacoes}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Resumo do Template</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total de Itens</p>
                <p className="font-semibold text-gray-900">{totalItens}</p>
              </div>
              <div>
                <p className="text-gray-600">Hospedagens</p>
                <p className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.hospedagens)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Atividades</p>
                <p className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.atividades)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Transportes</p>
                <p className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.transportes)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Alimentação</p>
                <p className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.alimentacoes)}
                </p>
              </div>
              <div className="border-l-2 border-blue-300 pl-4">
                <p className="text-gray-600 font-semibold">Valor Base</p>
                <p className="font-bold text-lg text-blue-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.total)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
