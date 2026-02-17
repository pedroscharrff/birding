"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/useToast'

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

interface InvoiceHistoryProps {
  osId?: string
  cotacaoId?: string
}

export function InvoiceHistory({ osId, cotacaoId }: InvoiceHistoryProps) {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams()
      if (osId) params.append('osId', osId)
      if (cotacaoId) params.append('cotacaoId', cotacaoId)

      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error('Erro ao carregar invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (osId || cotacaoId) {
      fetchInvoices()
    }
  }, [osId, cotacaoId])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este invoice?')) return

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Invoice excluído',
          description: 'O invoice foi removido com sucesso',
          variant: 'success',
        })
        fetchInvoices()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir invoice',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (value: number, moeda: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: moeda,
    }).format(value)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices Gerados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices Gerados
          </CardTitle>
          <CardDescription>
            Histórico de invoices gerados para esta {osId ? 'OS' : 'cotação'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            Nenhum invoice gerado ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoices Gerados ({invoices.length})
        </CardTitle>
        <CardDescription>
          Histórico de invoices gerados para esta {osId ? 'OS' : 'cotação'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-semibold text-gray-900">
                    Invoice #{invoice.numero}
                  </p>
                  <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                    {statusLabels[invoice.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{invoice.titulo}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Emitido em {format(new Date(invoice.dataEmissao), 'dd/MM/yyyy')}
                  </span>
                  {invoice.dataVencimento && (
                    <span>
                      Vence em {format(new Date(invoice.dataVencimento), 'dd/MM/yyyy')}
                    </span>
                  )}
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(Number(invoice.valorTotal), invoice.moeda)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/invoices/${invoice.id}`} target="_blank">
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Link>
                </Button>
                {invoice.status !== 'pago' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(invoice.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
