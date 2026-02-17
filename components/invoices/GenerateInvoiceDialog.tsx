"use client"

import { useState, useEffect } from 'react'
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
import { Loader2, FileText, Settings } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

const invoiceSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  clienteNome: z.string().min(2, 'Nome do cliente é obrigatório'),
  clienteEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  clienteTelefone: z.string().optional(),
  clienteDocumento: z.string().optional(),
  clienteEndereco: z.string().optional(),
  dataEmissao: z.string(),
  dataVencimento: z.string().optional(),
  contaPagamentoId: z.string().optional(),
  observacoes: z.string().optional(),
  termosCondicoes: z.string().optional(),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface GenerateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  osId?: string
  cotacaoId?: string
  osData?: any
  cotacaoData?: any
  onSuccess?: (invoiceId: string) => void
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  osId,
  cotacaoId,
  osData,
  cotacaoData,
  onSuccess,
}: GenerateInvoiceDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [contasPagamento, setContasPagamento] = useState<any[]>([])
  const [previousInvoices, setPreviousInvoices] = useState<any[]>([])
  const [loadingPreviousInvoices, setLoadingPreviousInvoices] = useState(false)
  const [selectedItems, setSelectedItems] = useState<any>({
    hospedagens: [],
    atividades: [],
    transportes: [],
    passagens: [],
    alimentacoes: [],
    itens: [], // Para cotações
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      dataEmissao: new Date().toISOString().split('T')[0],
    },
  })

  const contaPagamentoId = watch('contaPagamentoId')

  // Carregar contas de pagamento
  useEffect(() => {
    const fetchContas = async () => {
      try {
        const response = await fetch('/api/contas-pagamento?ativas=true')
        if (response.ok) {
          const data = await response.json()
          setContasPagamento(data)
          
          // Selecionar conta padrão automaticamente
          const contaPadrao = data.find((c: any) => c.padrao)
          if (contaPadrao) {
            setValue('contaPagamentoId', contaPadrao.id)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar contas de pagamento:', error)
      }
    }

    if (open) {
      fetchContas()
    }
  }, [open, setValue])

  // Preencher dados iniciais
  useEffect(() => {
    if (osData) {
      setValue('titulo', `Invoice - ${osData.titulo}`)
      setValue('clienteNome', osData.participantes?.[0]?.nome || '')
      setValue('clienteEmail', osData.participantes?.[0]?.email || '')
      setValue('clienteTelefone', osData.participantes?.[0]?.telefone || '')
      setValue('descricao', osData.descricao || '')
      
      // Selecionar todos os itens por padrão
      setSelectedItems({
        hospedagens: osData.hospedagens?.map((h: any) => h.id) || [],
        atividades: osData.atividades?.filter((a: any) => a.tipo === 'atividade').map((a: any) => a.id) || [],
        alimentacoes: osData.atividades?.filter((a: any) => a.tipo === 'alimentacao').map((a: any) => a.id) || [],
        transportes: osData.transportes?.map((t: any) => t.id) || [],
        passagens: osData.passagensAereas?.map((p: any) => p.id) || [],
      })
    } else if (cotacaoData) {
      setValue('titulo', `Invoice - ${cotacaoData.titulo}`)
      setValue('clienteNome', cotacaoData.clienteNome || '')
      setValue('clienteEmail', cotacaoData.clienteEmail || '')
      setValue('clienteTelefone', cotacaoData.clienteTelefone || '')
      setValue('descricao', cotacaoData.observacoesCliente || '')
      
      // Selecionar todos os itens por padrão
      setSelectedItems({
        itens: cotacaoData.itens?.map((i: any) => i.id) || [],
      })
    }
  }, [osData, cotacaoData, setValue])

  const toggleItem = (category: string, itemId: string) => {
    setSelectedItems((prev: any) => {
      const current = prev[category] || []
      const isSelected = current.includes(itemId)
      
      return {
        ...prev,
        [category]: isSelected
          ? current.filter((id: string) => id !== itemId)
          : [...current, itemId],
      }
    })
  }

  // Buscar invoices anteriores
  const fetchPreviousInvoices = async () => {
    if (!osId && !cotacaoId) return
    
    setLoadingPreviousInvoices(true)
    try {
      const params = new URLSearchParams()
      if (osId) params.append('osId', osId)
      if (cotacaoId) params.append('cotacaoId', cotacaoId)
      
      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPreviousInvoices(data)
      }
    } catch (error) {
      console.error('Erro ao buscar invoices anteriores:', error)
    } finally {
      setLoadingPreviousInvoices(false)
    }
  }

  // Importar dados de um invoice anterior
  const importFromInvoice = (invoice: any) => {
    setValue('titulo', invoice.titulo)
    setValue('descricao', invoice.descricao || '')
    setValue('clienteNome', invoice.clienteNome)
    setValue('clienteEmail', invoice.clienteEmail || '')
    setValue('clienteTelefone', invoice.clienteTelefone || '')
    setValue('clienteDocumento', invoice.clienteDocumento || '')
    setValue('clienteEndereco', invoice.clienteEndereco || '')
    setValue('contaPagamentoId', invoice.contaPagamentoId || '')
    setValue('observacoes', invoice.observacoes || '')
    setValue('termosCondicoes', invoice.termosCondicoes || '')
    
    toast({
      title: 'Dados importados',
      description: `Informações do Invoice #${invoice.numero} foram importadas`,
      variant: 'success',
    })
  }

  // Buscar invoices anteriores quando o dialog abrir
  useEffect(() => {
    if (open) {
      fetchPreviousInvoices()
    }
  }, [open, osId, cotacaoId])

  const onSubmit = async (data: InvoiceFormData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          osId,
          cotacaoId,
          ...data,
          itensIncluidos: selectedItems,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar invoice')
      }

      toast({
        title: 'Invoice gerado com sucesso!',
        description: `Invoice #${result.numero} foi criado`,
        variant: 'success',
      })

      onSuccess?.(result.id)
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar invoice',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Agrupar itens da OS por extensão
  const groupOSItemsByExtension = () => {
    if (!osData) return { tourPrincipal: {}, extensoes: [] }

    const groups: any = {
      tourPrincipal: {
        nome: 'Tour Principal',
        hospedagens: [],
        atividades: [],
        alimentacoes: [],
        transportes: [],
        passagens: [],
      },
      extensoes: [],
    }

    // Itens do tour principal (sem extensaoId)
    if (osData.hospedagens) {
      groups.tourPrincipal.hospedagens = osData.hospedagens.filter((h: any) => !h.extensaoId)
    }

    if (osData.atividades) {
      groups.tourPrincipal.atividades = osData.atividades.filter(
        (a: any) => !a.extensaoId && a.tipo === 'atividade'
      )
      groups.tourPrincipal.alimentacoes = osData.atividades.filter(
        (a: any) => !a.extensaoId && a.tipo === 'alimentacao'
      )
    }

    if (osData.transportes) {
      groups.tourPrincipal.transportes = osData.transportes.filter((t: any) => !t.extensaoId)
    }

    if (osData.passagensAereas) {
      groups.tourPrincipal.passagens = osData.passagensAereas.filter((p: any) => !p.extensaoId)
    }

    // Itens das extensões
    if (osData.extensoes) {
      osData.extensoes.forEach((ext: any) => {
        const extensaoGroup: any = {
          id: ext.id,
          nome: ext.nome,
          hospedagens: [],
          atividades: [],
          alimentacoes: [],
          transportes: [],
          passagens: [],
        }

        if (osData.hospedagens) {
          extensaoGroup.hospedagens = osData.hospedagens.filter((h: any) => h.extensaoId === ext.id)
        }

        if (osData.atividades) {
          extensaoGroup.atividades = osData.atividades.filter(
            (a: any) => a.extensaoId === ext.id && a.tipo === 'atividade'
          )
          extensaoGroup.alimentacoes = osData.atividades.filter(
            (a: any) => a.extensaoId === ext.id && a.tipo === 'alimentacao'
          )
        }

        if (osData.transportes) {
          extensaoGroup.transportes = osData.transportes.filter((t: any) => t.extensaoId === ext.id)
        }

        if (osData.passagensAereas) {
          extensaoGroup.passagens = osData.passagensAereas.filter((p: any) => p.extensaoId === ext.id)
        }

        // Só adicionar extensão se tiver pelo menos um item
        const hasItems =
          extensaoGroup.hospedagens.length > 0 ||
          extensaoGroup.atividades.length > 0 ||
          extensaoGroup.alimentacoes.length > 0 ||
          extensaoGroup.transportes.length > 0 ||
          extensaoGroup.passagens.length > 0

        if (hasItems) {
          groups.extensoes.push(extensaoGroup)
        }
      })
    }

    return groups
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Invoice
          </DialogTitle>
          <DialogDescription>
            Personalize as informações e selecione os serviços que serão incluídos no invoice
          </DialogDescription>
          
          {/* Importar de Invoice Anterior */}
          {previousInvoices.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Importar dados de invoice anterior</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Preencha automaticamente com informações de um invoice já criado
                  </p>
                </div>
                <Select onValueChange={(value) => {
                  const invoice = previousInvoices.find(inv => inv.id === value)
                  if (invoice) importFromInvoice(invoice)
                }}>
                  <SelectTrigger className="w-48 bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {previousInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        Invoice #{inv.numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados do Invoice</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
              <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="titulo">Título do Invoice *</Label>
                  <Input id="titulo" {...register('titulo')} />
                  {errors.titulo && (
                    <p className="text-sm text-red-600 mt-1">{errors.titulo.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" rows={3} {...register('descricao')} />
                </div>

                <div>
                  <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                  <Input id="clienteNome" {...register('clienteNome')} />
                  {errors.clienteNome && (
                    <p className="text-sm text-red-600 mt-1">{errors.clienteNome.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clienteEmail">E-mail do Cliente</Label>
                  <Input id="clienteEmail" type="email" {...register('clienteEmail')} />
                  {errors.clienteEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.clienteEmail.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clienteTelefone">Telefone</Label>
                  <Input id="clienteTelefone" {...register('clienteTelefone')} />
                </div>

                <div>
                  <Label htmlFor="clienteDocumento">CPF/CNPJ</Label>
                  <Input id="clienteDocumento" {...register('clienteDocumento')} />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="clienteEndereco">Endereço</Label>
                  <Textarea id="clienteEndereco" rows={2} {...register('clienteEndereco')} />
                </div>

                <div>
                  <Label htmlFor="dataEmissao">Data de Emissão *</Label>
                  <Input id="dataEmissao" type="date" {...register('dataEmissao')} />
                </div>

                <div>
                  <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                  <Input id="dataVencimento" type="date" {...register('dataVencimento')} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="servicos" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">
                Selecione os serviços que serão incluídos no invoice
              </p>

              {osData && (() => {
                const groups = groupOSItemsByExtension()
                
                // Função helper para renderizar um grupo
                const renderGroup = (group: any, isExtension: boolean = false) => {
                  const hasItems =
                    group.hospedagens?.length > 0 ||
                    group.atividades?.length > 0 ||
                    group.alimentacoes?.length > 0 ||
                    group.transportes?.length > 0 ||
                    group.passagens?.length > 0

                  if (!hasItems) return null

                  return (
                    <div key={group.id || 'tour-principal'} className={`p-4 rounded-lg ${isExtension ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border-2 border-gray-300'}`}>
                      {/* Cabeçalho do Grupo */}
                      <h3 className={`text-lg font-bold mb-4 ${isExtension ? 'text-blue-900' : 'text-gray-900'}`}>
                        {isExtension && '📍 '}{group.nome}
                      </h3>

                      <div className="space-y-6">
                        {/* Hospedagens */}
                        {group.hospedagens?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase text-gray-700">Hospedagens</h4>
                            <div className="space-y-2">
                              {group.hospedagens.map((hosp: any) => (
                                <div key={hosp.id} className="flex items-center space-x-2 p-2 bg-white border rounded">
                                  <Checkbox
                                    checked={selectedItems.hospedagens?.includes(hosp.id)}
                                    onCheckedChange={() => toggleItem('hospedagens', hosp.id)}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{hosp.hotelNome}</p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(hosp.checkin).toLocaleDateString()} - {new Date(hosp.checkout).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <p className="font-semibold">{formatCurrency(Number(hosp.custoTotal || 0))}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Atividades */}
                        {group.atividades?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase text-gray-700">Atividades</h4>
                            <div className="space-y-2">
                              {group.atividades.map((ativ: any) => (
                                <div key={ativ.id} className="flex items-center space-x-2 p-2 bg-white border rounded">
                                  <Checkbox
                                    checked={selectedItems.atividades?.includes(ativ.id)}
                                    onCheckedChange={() => toggleItem('atividades', ativ.id)}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{ativ.nome}</p>
                                    {ativ.data && (
                                      <p className="text-sm text-gray-600">
                                        {new Date(ativ.data).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <p className="font-semibold">{formatCurrency(Number(ativ.valor || 0))}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Alimentação */}
                        {group.alimentacoes?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase text-gray-700">Alimentação</h4>
                            <div className="space-y-2">
                              {group.alimentacoes.map((alim: any) => (
                                <div key={alim.id} className="flex items-center space-x-2 p-2 bg-white border rounded">
                                  <Checkbox
                                    checked={selectedItems.alimentacoes?.includes(alim.id)}
                                    onCheckedChange={() => toggleItem('alimentacoes', alim.id)}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{alim.nome}</p>
                                    {alim.data && (
                                      <p className="text-sm text-gray-600">
                                        {new Date(alim.data).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <p className="font-semibold">{formatCurrency(Number(alim.valor || 0))}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Transportes */}
                        {group.transportes?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase text-gray-700">Transportes</h4>
                            <div className="space-y-2">
                              {group.transportes.map((transp: any) => (
                                <div key={transp.id} className="flex items-center space-x-2 p-2 bg-white border rounded">
                                  <Checkbox
                                    checked={selectedItems.transportes?.includes(transp.id)}
                                    onCheckedChange={() => toggleItem('transportes', transp.id)}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{transp.tipo.replace(/_/g, ' ')}</p>
                                    <p className="text-sm text-gray-600">
                                      {transp.origem} → {transp.destino}
                                    </p>
                                  </div>
                                  <p className="font-semibold">{formatCurrency(Number(transp.custo || 0))}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Passagens Aéreas */}
                        {group.passagens?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase text-gray-700">Passagens Aéreas</h4>
                            <div className="space-y-2">
                              {group.passagens.map((pass: any) => (
                                <div key={pass.id} className="flex items-center space-x-2 p-2 bg-white border rounded">
                                  <Checkbox
                                    checked={selectedItems.passagens?.includes(pass.id)}
                                    onCheckedChange={() => toggleItem('passagens', pass.id)}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{pass.passageiroNome}</p>
                                    <p className="text-sm text-gray-600">{pass.trecho}</p>
                                  </div>
                                  <p className="font-semibold">{formatCurrency(Number(pass.custo || 0))}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    {/* Tour Principal */}
                    {renderGroup(groups.tourPrincipal, false)}

                    {/* Extensões */}
                    {groups.extensoes.map((extensao: any) => renderGroup(extensao, true))}
                  </div>
                )
              })()}

              {cotacaoData && cotacaoData.itens && (
                <div className="space-y-2">
                  {cotacaoData.itens.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        checked={selectedItems.itens?.includes(item.id)}
                        onCheckedChange={() => toggleItem('itens', item.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.descricao}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantidade}x {formatCurrency(Number(item.valorUnitario))}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(Number(item.subtotal))}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pagamento" className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="contaPagamento">Conta para Pagamento</Label>
                  <Link 
                    href="/dashboard/contas-pagamento" 
                    target="_blank"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Gerenciar Contas
                  </Link>
                </div>
                <Select
                  value={contaPagamentoId}
                  onValueChange={(value) => setValue('contaPagamentoId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {contasPagamento.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        Nenhuma conta cadastrada
                      </div>
                    ) : (
                      contasPagamento.map((conta) => (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome} {conta.padrao && '(Padrão)'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {contasPagamento.length === 0 ? (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ Você precisa cadastrar pelo menos uma conta de pagamento primeiro.
                    <Link 
                      href="/dashboard/contas-pagamento" 
                      target="_blank"
                      className="text-blue-600 hover:text-blue-700 underline ml-1"
                    >
                      Clique aqui para cadastrar
                    </Link>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    Esta conta será exibida no invoice para o cliente realizar o pagamento
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" rows={3} {...register('observacoes')} />
              </div>

              <div>
                <Label htmlFor="termosCondicoes">Termos e Condições</Label>
                <Textarea
                  id="termosCondicoes"
                  rows={4}
                  {...register('termosCondicoes')}
                  placeholder="Ex: Pagamento à vista com 5% de desconto. Parcelamento em até 3x sem juros."
                />
              </div>
            </TabsContent>
          </Tabs>

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
              Gerar Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
