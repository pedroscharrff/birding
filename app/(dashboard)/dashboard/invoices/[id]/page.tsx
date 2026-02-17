"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorMessage } from '@/components/ui/error-message'
import { useToast } from '@/hooks/useToast'
import { 
  ArrowLeft, 
  Download, 
  Send, 
  Printer, 
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2 
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SendInvoiceEmailDialog } from '@/components/invoices/SendInvoiceEmailDialog'

const statusColors = {
  rascunho: 'bg-gray-100 text-gray-800',
  enviado: 'bg-blue-100 text-blue-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  vencido: 'bg-orange-100 text-orange-800',
}

const statusLabels = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  pago: 'Pago',
  cancelado: 'Cancelado',
  vencido: 'Vencido',
}

export default function InvoiceViewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)
  
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      } else {
        setError('Invoice não encontrado')
      }
    } catch (error) {
      console.error('Erro ao carregar invoice:', error)
      setError('Erro ao carregar invoice')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: 'Status atualizado',
          description: `Invoice marcado como ${statusLabels[newStatus as keyof typeof statusLabels]}`,
          variant: 'success',
        })
        fetchInvoice()
      }
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        variant: 'destructive',
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return

    try {
      setIsDownloading(true)
      const element = printRef.current
      
      // Import html2pdf dynamically to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `invoice-${invoice.numero}.pdf`,
        image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as 'mm', format: 'a4' as 'a4', orientation: 'portrait' as 'portrait' }
      }

      await html2pdf().set(opt).from(element).save()

      toast({
        title: 'Download concluído',
        description: 'Seu invoice foi baixado com sucesso',
        variant: 'success',
      })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Ocorreu um erro ao tentar gerar o arquivo PDF',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSendEmail = () => {
    setEmailDialogOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: invoice?.moeda || 'BRL',
    }).format(value)
  }

  // Agrupar itens por extensão
  const groupItemsByExtension = () => {
    if (!invoice?.os) return { tourPrincipal: {}, extensoes: [] }

    const groups: any = {
      tourPrincipal: {
        nome: 'Tour Principal',
        hospedagens: [],
        atividades: [],
        transportes: [],
        passagens: [],
      },
      extensoes: [],
    }

    // Itens do tour principal (extensaoId = null)
    if (invoice.os.hospedagens) {
      groups.tourPrincipal.hospedagens = invoice.os.hospedagens.filter(
        (h: any) => !h.extensaoId && invoice.itensIncluidos.hospedagens?.includes(h.id)
      )
    }

    if (invoice.os.atividades) {
      groups.tourPrincipal.atividades = invoice.os.atividades.filter(
        (a: any) => !a.extensaoId && invoice.itensIncluidos.atividades?.includes(a.id)
      )
    }

    if (invoice.os.transportes) {
      groups.tourPrincipal.transportes = invoice.os.transportes.filter(
        (t: any) => !t.extensaoId && invoice.itensIncluidos.transportes?.includes(t.id)
      )
    }

    if (invoice.os.passagensAereas) {
      groups.tourPrincipal.passagens = invoice.os.passagensAereas.filter(
        (p: any) => !p.extensaoId && invoice.itensIncluidos.passagens?.includes(p.id)
      )
    }

    // Itens das extensões
    if (invoice.os.extensoes) {
      invoice.os.extensoes.forEach((ext: any) => {
        const extensaoGroup: any = {
          id: ext.id,
          nome: ext.nome,
          hospedagens: [],
          atividades: [],
          transportes: [],
          passagens: [],
        }

        if (invoice.os.hospedagens) {
          extensaoGroup.hospedagens = invoice.os.hospedagens.filter(
            (h: any) => h.extensaoId === ext.id && invoice.itensIncluidos.hospedagens?.includes(h.id)
          )
        }

        if (invoice.os.atividades) {
          extensaoGroup.atividades = invoice.os.atividades.filter(
            (a: any) => a.extensaoId === ext.id && invoice.itensIncluidos.atividades?.includes(a.id)
          )
        }

        if (invoice.os.transportes) {
          extensaoGroup.transportes = invoice.os.transportes.filter(
            (t: any) => t.extensaoId === ext.id && invoice.itensIncluidos.transportes?.includes(t.id)
          )
        }

        if (invoice.os.passagensAereas) {
          extensaoGroup.passagens = invoice.os.passagensAereas.filter(
            (p: any) => p.extensaoId === ext.id && invoice.itensIncluidos.passagens?.includes(p.id)
          )
        }

        // Só adicionar extensão se tiver pelo menos um item
        const hasItems = 
          extensaoGroup.hospedagens.length > 0 ||
          extensaoGroup.atividades.length > 0 ||
          extensaoGroup.transportes.length > 0 ||
          extensaoGroup.passagens.length > 0

        if (hasItems) {
          groups.extensoes.push(extensaoGroup)
        }
      })
    }

    return groups
  }

  if (loading) {
    return <InvoiceSkeleton />
  }

  if (error || !invoice) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/os">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
        <ErrorMessage
          title="Erro ao carregar invoice"
          message={error || 'Invoice não encontrado'}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Não imprime */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href={invoice.osId ? `/dashboard/os/${invoice.osId}` : '/dashboard/os'}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.numero}</h1>
            <p className="text-gray-600 mt-1">
              Criado em {format(new Date(invoice.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={invoice.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Send className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Invoice Content - Imprimível */}
      <div ref={printRef} className="bg-white rounded-lg border border-gray-200 p-8 print:border-0 print:shadow-none">
        {/* Header do Invoice */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{invoice.organizacao.nome}</h2>
            <Badge className={`mt-2 ${statusColors[invoice.status as keyof typeof statusColors]}`}>
              {statusLabels[invoice.status as keyof typeof statusLabels]}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">INVOICE</p>
            <p className="text-lg text-gray-600">#{invoice.numero}</p>
          </div>
        </div>

        {/* Informações do Cliente e Datas */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Cliente</h3>
            <p className="font-semibold text-gray-900">{invoice.clienteNome}</p>
            {invoice.clienteEmail && <p className="text-gray-600">{invoice.clienteEmail}</p>}
            {invoice.clienteTelefone && <p className="text-gray-600">{invoice.clienteTelefone}</p>}
            {invoice.clienteDocumento && <p className="text-gray-600">CPF/CNPJ: {invoice.clienteDocumento}</p>}
            {invoice.clienteEndereco && (
              <p className="text-gray-600 mt-2 whitespace-pre-line">{invoice.clienteEndereco}</p>
            )}
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="text-sm text-gray-500">Data de Emissão</p>
              <p className="font-semibold text-gray-900">
                {format(new Date(invoice.dataEmissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            {invoice.dataVencimento && (
              <div>
                <p className="text-sm text-gray-500">Data de Vencimento</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(invoice.dataVencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Título e Descrição */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{invoice.titulo}</h3>
          {invoice.descricao && (
            <p className="text-gray-600 whitespace-pre-line">{invoice.descricao}</p>
          )}
        </div>

        {/* Itens do Invoice - Agrupados por Tour/Extensão */}
        <div className="mb-8">
          {(() => {
            const groups = groupItemsByExtension()
            
            // Função helper para renderizar um grupo de itens
            const renderGroup = (group: any, isExtension: boolean = false) => {
              const hasItems = 
                group.hospedagens?.length > 0 ||
                group.atividades?.length > 0 ||
                group.transportes?.length > 0 ||
                group.passagens?.length > 0

              if (!hasItems) return null

              return (
                <div key={group.id || 'tour-principal'} className="mb-6">
                  {/* Cabeçalho do Grupo */}
                  <div className={`mb-3 pb-2 ${isExtension ? 'border-b-2 border-blue-200' : 'border-b-2 border-gray-400'}`}>
                    <h3 className={`text-lg font-bold ${isExtension ? 'text-blue-900' : 'text-gray-900'}`}>
                      {isExtension && '📍 '}{group.nome}
                    </h3>
                  </div>

                  <table className="w-full mb-4">
                    <tbody>
                      {/* Hospedagens */}
                      {group.hospedagens?.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={2} className="pt-3 pb-2">
                              <p className="font-semibold text-gray-700 text-sm uppercase">Hospedagens</p>
                            </td>
                          </tr>
                          {group.hospedagens.map((hosp: any) => (
                            <tr key={hosp.id} className="border-b border-gray-100">
                              <td className="py-2 pl-4">
                                <p className="font-medium text-gray-900">{hosp.hotelNome}</p>
                                <p className="text-sm text-gray-600">
                                  {format(new Date(hosp.checkin), 'dd/MM/yyyy')} - {format(new Date(hosp.checkout), 'dd/MM/yyyy')}
                                </p>
                              </td>
                              <td className="text-right py-2 font-medium text-gray-900">
                                {formatCurrency(Number(hosp.custoTotal || 0))}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}

                      {/* Atividades */}
                      {group.atividades?.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={2} className="pt-3 pb-2">
                              <p className="font-semibold text-gray-700 text-sm uppercase">Atividades</p>
                            </td>
                          </tr>
                          {group.atividades.map((ativ: any) => (
                            <tr key={ativ.id} className="border-b border-gray-100">
                              <td className="py-2 pl-4">
                                <p className="font-medium text-gray-900">{ativ.nome}</p>
                                {ativ.data && (
                                  <p className="text-sm text-gray-600">
                                    {format(new Date(ativ.data), 'dd/MM/yyyy')}
                                  </p>
                                )}
                              </td>
                              <td className="text-right py-2 font-medium text-gray-900">
                                {formatCurrency(Number(ativ.valor || 0))}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}

                      {/* Transportes */}
                      {group.transportes?.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={2} className="pt-3 pb-2">
                              <p className="font-semibold text-gray-700 text-sm uppercase">Transportes</p>
                            </td>
                          </tr>
                          {group.transportes.map((transp: any) => (
                            <tr key={transp.id} className="border-b border-gray-100">
                              <td className="py-2 pl-4">
                                <p className="font-medium text-gray-900">
                                  {transp.tipo.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {transp.origem} → {transp.destino}
                                </p>
                              </td>
                              <td className="text-right py-2 font-medium text-gray-900">
                                {formatCurrency(Number(transp.custo || 0))}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}

                      {/* Passagens Aéreas */}
                      {group.passagens?.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={2} className="pt-3 pb-2">
                              <p className="font-semibold text-gray-700 text-sm uppercase">Passagens Aéreas</p>
                            </td>
                          </tr>
                          {group.passagens.map((pass: any) => (
                            <tr key={pass.id} className="border-b border-gray-100">
                              <td className="py-2 pl-4">
                                <p className="font-medium text-gray-900">{pass.passageiroNome}</p>
                                <p className="text-sm text-gray-600">{pass.trecho}</p>
                              </td>
                              <td className="text-right py-2 font-medium text-gray-900">
                                {formatCurrency(Number(pass.custo || 0))}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )
            }

            return (
              <>
                {/* Tour Principal */}
                {renderGroup(groups.tourPrincipal, false)}

                {/* Extensões */}
                {groups.extensoes.map((extensao: any) => renderGroup(extensao, true))}
              </>
            )
          })()}
        </div>

        {/* Total */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-3 border-t-2 border-gray-300">
              <span className="text-lg font-bold text-gray-900">TOTAL</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(Number(invoice.valorTotal))}
              </span>
            </div>
          </div>
        </div>

        {/* Informações de Pagamento */}
        {invoice.contaPagamento && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
              Informações para Pagamento
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {invoice.contaPagamento.banco && (
                <div>
                  <p className="text-gray-500">Banco</p>
                  <p className="font-medium text-gray-900">{invoice.contaPagamento.banco}</p>
                </div>
              )}
              {invoice.contaPagamento.agencia && (
                <div>
                  <p className="text-gray-500">Agência</p>
                  <p className="font-medium text-gray-900">{invoice.contaPagamento.agencia}</p>
                </div>
              )}
              {invoice.contaPagamento.conta && (
                <div>
                  <p className="text-gray-500">Conta</p>
                  <p className="font-medium text-gray-900">{invoice.contaPagamento.conta}</p>
                </div>
              )}
              {invoice.contaPagamento.titular && (
                <div>
                  <p className="text-gray-500">Titular</p>
                  <p className="font-medium text-gray-900">{invoice.contaPagamento.titular}</p>
                </div>
              )}
              {invoice.contaPagamento.chavePix && (
                <div className="col-span-2">
                  <p className="text-gray-500">Chave PIX ({invoice.contaPagamento.tipoChavePix})</p>
                  <p className="font-medium text-gray-900">{invoice.contaPagamento.chavePix}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observações */}
        {invoice.observacoes && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Observações</h3>
            <p className="text-gray-600 whitespace-pre-line">{invoice.observacoes}</p>
          </div>
        )}

        {/* Termos e Condições */}
        {invoice.termosCondicoes && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
              Termos e Condições
            </h3>
            <p className="text-gray-600 whitespace-pre-line">{invoice.termosCondicoes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8 border-t">
          <p>Obrigado pela preferência!</p>
        </div>
      </div>

      {/* Email Dialog */}
      <SendInvoiceEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        invoiceId={params.id as string}
        defaultEmail={invoice?.clienteEmail}
        onSuccess={fetchInvoice}
      />
    </div>
  )
}

function InvoiceSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <div className="flex-1">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
