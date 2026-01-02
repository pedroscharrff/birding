"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search, Edit, Trash2, Copy } from "lucide-react"
import { CreateTemplateDialog } from "@/components/cotacoes/templates/CreateTemplateDialog"

export default function TemplatesCotacoesPage() {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [refreshKey, setRefreshKey] = useState(0)

  const mockTemplates = [
    {
      id: "1",
      nome: "Pantanal Sul - 7 dias",
      descricao: "Pacote completo Pantanal Sul com hospedagem, atividades e transporte",
      categoria: "Pantanal",
      totalItens: 12,
      valorBase: 8500.00,
      usadoEm: 15,
      createdAt: "2025-12-15",
    },
    {
      id: "2",
      nome: "Amazônia - Observação de Aves",
      descricao: "Tour focado em observação de aves na Amazônia",
      categoria: "Amazônia",
      totalItens: 8,
      valorBase: 12000.00,
      usadoEm: 8,
      createdAt: "2025-11-20",
    },
    {
      id: "3",
      nome: "Bonito - Ecoturismo",
      descricao: "Pacote de ecoturismo em Bonito com flutuação e cachoeiras",
      categoria: "Bonito",
      totalItens: 10,
      valorBase: 6500.00,
      usadoEm: 22,
      createdAt: "2025-10-10",
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

  const filteredTemplates = mockTemplates.filter(template =>
    template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Cotações</h1>
          <p className="text-gray-600 mt-1">
            Crie e gerencie templates reutilizáveis para agilizar suas cotações
          </p>
        </div>
        <CreateTemplateDialog onSuccess={handleRefresh} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar templates por nome, descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Template</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Total de Itens</TableHead>
              <TableHead>Valor Base</TableHead>
              <TableHead>Usado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum template encontrado</p>
                  <p className="text-sm mt-1">Crie seu primeiro template de cotação</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{template.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.categoria}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{template.descricao}</TableCell>
                  <TableCell>{template.totalItens} itens</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(template.valorBase)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {template.usadoEm} cotações
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" title="Duplicar">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Excluir">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Sobre Templates</h3>
            <p className="text-sm text-blue-800 mt-1">
              Templates são modelos pré-configurados de cotações que você pode reutilizar. 
              Ao criar uma nova cotação, você pode selecionar um template e todos os itens 
              (hospedagens, atividades, transportes, alimentação) serão preenchidos automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
