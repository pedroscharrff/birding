"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/useToast"
import { ArrowLeft, Save, Trash2, Copy, FileText, Send, Download } from "lucide-react"
import { CotacaoHospedagensSection } from "@/components/cotacoes/sections/CotacaoHospedagensSection"
import { CotacaoAtividadesSection } from "@/components/cotacoes/sections/CotacaoAtividadesSection"
import { CotacaoTransportesSection } from "@/components/cotacoes/sections/CotacaoTransportesSection"
import { CotacaoAlimentacaoSection } from "@/components/cotacoes/sections/CotacaoAlimentacaoSection"

const editCotacaoSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  clienteNome: z.string().min(2, "Nome do cliente é obrigatório"),
  clienteEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  clienteTelefone: z.string().optional(),
  destino: z.string().min(2, "Destino é obrigatório"),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  statusCotacao: z.enum(["rascunho", "enviada", "aceita", "perdida", "expirada"]),
  observacoesInternas: z.string().optional(),
  observacoesCliente: z.string().optional(),
})

type EditCotacaoInput = z.infer<typeof editCotacaoSchema>

const statusColors = {
  rascunho: "bg-gray-100 text-gray-800",
  enviada: "bg-blue-100 text-blue-800",
  aceita: "bg-green-100 text-green-800",
  perdida: "bg-red-100 text-red-800",
  expirada: "bg-orange-100 text-orange-800",
}

const statusLabels = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  aceita: "Aceita",
  perdida: "Perdida",
  expirada: "Expirada",
}

export default function CotacaoDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [cotacao, setCotacao] = useState<any>(null)

  const [hospedagens, setHospedagens] = useState<any[]>([])
  const [atividades, setAtividades] = useState<any[]>([])
  const [transportes, setTransportes] = useState<any[]>([])
  const [alimentacoes, setAlimentacoes] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditCotacaoInput>({
    resolver: zodResolver(editCotacaoSchema),
  })

  const statusCotacao = watch("statusCotacao")

  useEffect(() => {
    const mockCotacao = {
      id: params.id,
      titulo: "Cotação - Pantanal Sul Julho 2026",
      clienteNome: "João Silva",
      clienteEmail: "joao@email.com",
      clienteTelefone: "(67) 99999-9999",
      destino: "Bonito, MS",
      dataInicio: "2026-07-15",
      dataFim: "2026-07-22",
      statusCotacao: "rascunho",
      observacoesInternas: "Cliente interessado em pacote completo",
      observacoesCliente: "Inclui todas as refeições e atividades",
      responsavel: "Maria Santos",
      createdAt: "2026-01-02",
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
    }

    setCotacao(mockCotacao)
    setValue("titulo", mockCotacao.titulo)
    setValue("clienteNome", mockCotacao.clienteNome)
    setValue("clienteEmail", mockCotacao.clienteEmail)
    setValue("clienteTelefone", mockCotacao.clienteTelefone)
    setValue("destino", mockCotacao.destino)
    setValue("dataInicio", mockCotacao.dataInicio)
    setValue("dataFim", mockCotacao.dataFim)
    setValue("statusCotacao", mockCotacao.statusCotacao as any)
    setValue("observacoesInternas", mockCotacao.observacoesInternas)
    setValue("observacoesCliente", mockCotacao.observacoesCliente)
    
    setHospedagens(mockCotacao.hospedagens)
    setAtividades(mockCotacao.atividades)
    setTransportes(mockCotacao.transportes)
    setAlimentacoes(mockCotacao.alimentacoes)
  }, [params.id, setValue])

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

  const onSubmit = async (values: EditCotacaoInput) => {
    setLoading(true)
    try {
      const totais = calcularTotal()
      
      console.log("Atualizando cotação:", {
        id: params.id,
        ...values,
        hospedagens,
        atividades,
        transportes,
        alimentacoes,
        totais,
      })

      toast({
        title: "Sucesso!",
        description: "Cotação atualizada com sucesso (mock - API ainda não implementada)",
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cotação",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicar = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Duplicar cotação será implementado em breve",
    })
  }

  const handleConverterParaOS = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Conversão para OS será implementada em breve",
    })
  }

  const handleExportarPDF = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Exportar PDF será implementado em breve",
    })
  }

  const handleEnviarEmail = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Enviar por e-mail será implementado em breve",
    })
  }

  const handleDeletar = () => {
    if (confirm("Tem certeza que deseja deletar esta cotação?")) {
      toast({
        title: "Cotação deletada",
        description: "A cotação foi removida com sucesso (mock)",
        variant: "success",
      })
      router.push("/dashboard/cotacoes")
    }
  }

  const totais = calcularTotal()

  if (!cotacao) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/cotacoes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{cotacao.titulo}</h1>
              <Badge className={statusColors[statusCotacao as keyof typeof statusColors]}>
                {statusLabels[statusCotacao as keyof typeof statusLabels]}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">
              Criada em {new Date(cotacao.createdAt).toLocaleDateString('pt-BR')} • Responsável: {cotacao.responsavel}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleEnviarEmail}>
            <Send className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicar}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </Button>
          {statusCotacao === "rascunho" && (
            <Button variant="outline" size="sm" onClick={handleDeletar} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
          )}
          {(statusCotacao === "rascunho" || statusCotacao === "enviada") && (
            <Button onClick={handleConverterParaOS}>
              <FileText className="h-4 w-4 mr-2" />
              Converter em OS
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Dados Gerais</h3>
            <Select value={statusCotacao} onValueChange={(value) => setValue("statusCotacao", value as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="aceita">Aceita</SelectItem>
                <SelectItem value="perdida">Perdida</SelectItem>
                <SelectItem value="expirada">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="titulo">Título da Cotação *</Label>
              <Input
                id="titulo"
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
                {...register("clienteTelefone")}
              />
            </div>

            <div>
              <Label htmlFor="destino">Destino *</Label>
              <Input
                id="destino"
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
              rows={2}
              {...register("observacoesInternas")}
            />
          </div>

          <div>
            <Label htmlFor="observacoesCliente">Observações para o Cliente</Label>
            <Textarea
              id="observacoesCliente"
              rows={2}
              {...register("observacoesCliente")}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Resumo Financeiro</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Hospedagens</p>
              <p className="font-semibold text-gray-900">{formatCurrency(totais.hospedagens)}</p>
            </div>
            <div>
              <p className="text-gray-600">Atividades</p>
              <p className="font-semibold text-gray-900">{formatCurrency(totais.atividades)}</p>
            </div>
            <div>
              <p className="text-gray-600">Transportes</p>
              <p className="font-semibold text-gray-900">{formatCurrency(totais.transportes)}</p>
            </div>
            <div>
              <p className="text-gray-600">Alimentação</p>
              <p className="font-semibold text-gray-900">{formatCurrency(totais.alimentacoes)}</p>
            </div>
            <div className="border-l-2 border-blue-300 pl-4">
              <p className="text-gray-600 font-semibold">Total Geral</p>
              <p className="font-bold text-lg text-blue-600">{formatCurrency(totais.total)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/cotacoes")}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  )
}
