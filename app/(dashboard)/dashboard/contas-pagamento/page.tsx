"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Star } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { ContaPagamentoDialog } from '@/components/contas-pagamento/ContaPagamentoDialog'

export default function ContasPagamentoPage() {
  const { toast } = useToast()
  const [contas, setContas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConta, setEditingConta] = useState<any>(null)

  const fetchContas = async () => {
    try {
      const response = await fetch('/api/contas-pagamento')
      if (response.ok) {
        const data = await response.json()
        setContas(data)
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContas()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return

    try {
      const response = await fetch(`/api/contas-pagamento/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Conta excluída',
          description: 'A conta foi removida com sucesso',
          variant: 'success',
        })
        fetchContas()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir conta',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (conta: any) => {
    setEditingConta(conta)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingConta(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas de Pagamento</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as contas bancárias que serão exibidas nos invoices
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : contas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">Nenhuma conta cadastrada</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contas.map((conta) => (
            <Card key={conta.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{conta.nome}</CardTitle>
                      {conta.padrao && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                      {!conta.ativo && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Inativa
                        </span>
                      )}
                    </div>
                    {conta.banco && (
                      <CardDescription className="mt-1">{conta.banco}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(conta)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(conta.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {conta.agencia && (
                    <div>
                      <span className="text-gray-500">Agência:</span>
                      <p className="font-medium">{conta.agencia}</p>
                    </div>
                  )}
                  {conta.conta && (
                    <div>
                      <span className="text-gray-500">Conta:</span>
                      <p className="font-medium">{conta.conta}</p>
                    </div>
                  )}
                  {conta.titular && (
                    <div>
                      <span className="text-gray-500">Titular:</span>
                      <p className="font-medium">{conta.titular}</p>
                    </div>
                  )}
                  {conta.chavePix && (
                    <div>
                      <span className="text-gray-500">Chave PIX:</span>
                      <p className="font-medium">{conta.chavePix}</p>
                    </div>
                  )}
                </div>
                {conta.observacoes && (
                  <p className="text-sm text-gray-600 mt-4">{conta.observacoes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContaPagamentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        conta={editingConta}
        onSuccess={fetchContas}
      />
    </div>
  )
}
