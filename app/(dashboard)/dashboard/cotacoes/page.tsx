"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search, Filter, Settings } from "lucide-react"
import { CreateCotacaoDialog } from "@/components/cotacoes/CreateCotacaoDialog"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

export default function CotacoesPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [destinoFilter, setDestinoFilter] = useState<string>("")
  const [refreshKey, setRefreshKey] = useState(0)

  const mockCotacoes = [
    {
      id: "1",
      titulo: "Cotação - Pantanal Sul Julho 2026",
      clienteNome: "João Silva",
      destino: "Bonito, MS",
      dataInicio: "2026-07-15",
      dataFim: "2026-07-22",
      statusCotacao: "rascunho",
      valorTotal: 12500.00,
      responsavel: "Maria Santos",
      createdAt: "2026-01-02",
    },
    {
      id: "2",
      titulo: "Tour Amazônia - Grupo Observadores",
      clienteNome: "Ana Costa",
      destino: "Manaus, AM",
      dataInicio: "2026-08-10",
      dataFim: "2026-08-17",
      statusCotacao: "enviada",
      valorTotal: 18900.00,
      responsavel: "Pedro Oliveira",
      createdAt: "2026-01-01",
    },
  ]

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotações Rápidas</h1>
          <p className="text-gray-600 mt-1">
            Cotações simples que você pode converter em tours/OS quando o cliente aceitar
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/cotacoes/templates">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Gerenciar Templates
            </Button>
          </Link>
          <CreateCotacaoDialog onSuccess={handleRefresh} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-700">Filtros</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="aceita">Aceita</SelectItem>
                <SelectItem value="perdida">Perdida</SelectItem>
                <SelectItem value="expirada">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Destino
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar destino..."
                value={destinoFilter}
                onChange={(e) => setDestinoFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Responsável
            </label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Período
            </label>
            <Input type="date" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCotacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma cotação encontrada</p>
                  <p className="text-sm mt-1">Crie sua primeira cotação rápida</p>
                </TableCell>
              </TableRow>
            ) : (
              mockCotacoes.map((cotacao) => (
                <TableRow 
                  key={cotacao.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/cotacoes/${cotacao.id}`)}
                >
                  <TableCell className="font-medium">{cotacao.titulo}</TableCell>
                  <TableCell>{cotacao.clienteNome}</TableCell>
                  <TableCell>{cotacao.destino}</TableCell>
                  <TableCell>
                    {formatDate(cotacao.dataInicio)} - {formatDate(cotacao.dataFim)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[cotacao.statusCotacao as keyof typeof statusColors]}>
                      {statusLabels[cotacao.statusCotacao as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(cotacao.valorTotal)}
                  </TableCell>
                  <TableCell>{cotacao.responsavel}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/cotacoes/${cotacao.id}`)
                      }}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
