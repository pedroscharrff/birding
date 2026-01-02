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
import { useAuth } from "@/app/providers/AuthProvider"
import { Plus, FileText } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CotacaoHospedagensSection } from "./sections/CotacaoHospedagensSection"
import { CotacaoAtividadesSection } from "./sections/CotacaoAtividadesSection"
import { CotacaoTransportesSection } from "./sections/CotacaoTransportesSection"
import { CotacaoAlimentacaoSection } from "./sections/CotacaoAlimentacaoSection"

const createCotacaoSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  clienteNome: z.string().min(2, "Nome do cliente é obrigatório"),
  clienteEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  clienteTelefone: z.string().optional(),
  destino: z.string().min(2, "Destino é obrigatório"),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  observacoesInternas: z.string().optional(),
  observacoesCliente: z.string().optional(),
})

type CreateCotacaoInput = z.infer<typeof createCotacaoSchema>

interface CreateCotacaoDialogProps {
  onSuccess?: () => void
}

export function CreateCotacaoDialog({ onSuccess }: CreateCotacaoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [hospedagens, setHospedagens] = useState<any[]>([])
  const [atividades, setAtividades] = useState<any[]>([])
  const [transportes, setTransportes] = useState<any[]>([])
  const [alimentacoes, setAlimentacoes] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateCotacaoInput>({
    resolver: zodResolver(createCotacaoSchema),
  })

  const mockTemplates = [
    {
      id: "1",
      nome: "Pantanal Sul - 7 dias",
      destino: "Bonito, MS",
      hospedagens: [
        { id: "h1", descricao: "Hotel Fazenda - Quarto Duplo", quantidade: 6, valorUnitario: 450, moeda: "BRL", subtotal: 2700 },
        { id: "h2", descricao: "Pousada Ecológica - Suíte", quantidade: 1, valorUnitario: 800, moeda: "BRL", subtotal: 800 },
      ],
      atividades: [
        { id: "a1", descricao: "Safari Fotográfico", quantidade: 4, valorUnitario: 350, moeda: "BRL", subtotal: 1400 },
        { id: "a2", descricao: "Passeio de Barco", quantidade: 4, valorUnitario: 200, moeda: "BRL", subtotal: 800 },
      ],
      transportes: [
        { id: "t1", descricao: "Transfer Aeroporto-Hotel", quantidade: 2, valorUnitario: 150, moeda: "BRL", subtotal: 300 },
      ],
      alimentacoes: [
        { id: "al1", descricao: "Café da Manhã", quantidade: 7, valorUnitario: 45, moeda: "BRL", subtotal: 315 },
        { id: "al2", descricao: "Almoço", quantidade: 6, valorUnitario: 80, moeda: "BRL", subtotal: 480 },
      ],
    },
    {
      id: "2",
      nome: "Amazônia - Observação de Aves",
      destino: "Manaus, AM",
      hospedagens: [
        { id: "h3", descricao: "Lodge na Floresta", quantidade: 5, valorUnitario: 600, moeda: "BRL", subtotal: 3000 },
      ],
      atividades: [
        { id: "a3", descricao: "Trilha Guiada - Observação", quantidade: 4, valorUnitario: 400, moeda: "BRL", subtotal: 1600 },
        { id: "a4", descricao: "Passeio de Canoa", quantidade: 4, valorUnitario: 250, moeda: "BRL", subtotal: 1000 },
      ],
      transportes: [
        { id: "t2", descricao: "Lancha até o Lodge", quantidade: 2, valorUnitario: 300, moeda: "BRL", subtotal: 600 },
      ],
      alimentacoes: [
        { id: "al3", descricao: "Pensão Completa", quantidade: 5, valorUnitario: 150, moeda: "BRL", subtotal: 750 },
      ],
    },
  ]

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    
    if (!templateId || templateId === "none") {
      setHospedagens([])
      setAtividades([])
      setTransportes([])
      setAlimentacoes([])
      return
    }

    const template = mockTemplates.find(t => t.id === templateId)
    if (template) {
      setValue("destino", template.destino)
      setHospedagens(template.hospedagens || [])
      setAtividades(template.atividades || [])
      setTransportes(template.transportes || [])
      setAlimentacoes(template.alimentacoes || [])
      
      toast({
        title: "Template carregado!",
        description: `Itens do template "${template.nome}" foram preenchidos automaticamente`,
        variant: "success",
      })
    }
  }

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

  async function onSubmit(values: CreateCotacaoInput) {
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
      const totais = calcularTotal()
      
      console.log("Dados da cotação:", {
        ...values,
        hospedagens,
        atividades,
        transportes,
        alimentacoes,
        totais,
      })

      toast({
        title: "Sucesso!",
        description: "Cotação rápida criada com sucesso (mock - API ainda não implementada)",
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
        title: "Erro ao criar cotação",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totais = calcularTotal()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Cotação Rápida
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Cotação Rápida</DialogTitle>
          <DialogDescription>
            Preencha os dados básicos e adicione os itens da cotação. Você poderá converter em OS depois.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="template" className="text-blue-900 font-semibold">
                  Usar Template (Opcional)
                </Label>
                <p className="text-xs text-blue-700 mb-2">
                  Selecione um template para preencher automaticamente os itens da cotação
                </p>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione um template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (criar do zero)</SelectItem>
                    {mockTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900">Dados Gerais</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="titulo">Título da Cotação *</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Cotação - Pantanal Sul Julho 2026"
                  {...register("titulo")}
                />
                {errors.titulo && (
                  <p className="text-sm text-red-600 mt-1">{errors.titulo.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                <Input
                  id="clienteNome"
                  placeholder="Ex: João Silva"
                  {...register("clienteNome")}
                />
                {errors.clienteNome && (
                  <p className="text-sm text-red-600 mt-1">{errors.clienteNome.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clienteEmail">E-mail do Cliente</Label>
                <Input
                  id="clienteEmail"
                  type="email"
                  placeholder="cliente@email.com"
                  {...register("clienteEmail")}
                />
                {errors.clienteEmail && (
                  <p className="text-sm text-red-600 mt-1">{errors.clienteEmail.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clienteTelefone">Telefone do Cliente</Label>
                <Input
                  id="clienteTelefone"
                  placeholder="(00) 00000-0000"
                  {...register("clienteTelefone")}
                />
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
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  {...register("dataInicio")}
                />
              </div>

              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  {...register("dataFim")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoesInternas">Observações Internas</Label>
              <Textarea
                id="observacoesInternas"
                placeholder="Notas internas sobre a cotação..."
                rows={2}
                {...register("observacoesInternas")}
              />
            </div>

            <div>
              <Label htmlFor="observacoesCliente">Observações para o Cliente</Label>
              <Textarea
                id="observacoesCliente"
                placeholder="Informações que aparecerão na cotação enviada ao cliente..."
                rows={2}
                {...register("observacoesCliente")}
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Itens da Cotação</h3>
            
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
            <h3 className="font-semibold text-gray-900 mb-3">Resumo Financeiro</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
                <p className="text-gray-600 font-semibold">Total Geral</p>
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
              {loading ? "Salvando..." : "Salvar Cotação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
