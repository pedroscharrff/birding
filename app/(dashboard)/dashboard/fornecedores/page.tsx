"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import { 
  Plus, 
  Search, 
  X, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Filter,
  Pencil,
  Trash2,
  Eye,
  Building,
  Utensils,
  Car,
  Plane,
  Activity
} from 'lucide-react'
import { FornecedorFormDialog } from '@/components/forms/FornecedorFormDialog'

type TipoFornecedor = 'hotelaria' | 'guiamento' | 'transporte' | 'alimentacao' | 'atividade' | 'outros'

interface Fornecedor {
  id: string
  nomeFantasia: string
  razaoSocial?: string | null
  tipo: TipoFornecedor
  email?: string | null
  telefone?: string | null
  documento?: string | null
  endereco?: any
  obs?: string | null
  createdAt: string
  updatedAt: string
}

const tipoLabels: Record<TipoFornecedor, string> = {
  hotelaria: 'Hotelaria',
  guiamento: 'Guiamento',
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  atividade: 'Atividade',
  outros: 'Outros'
}

const tipoIcons: Record<TipoFornecedor, any> = {
  hotelaria: Building,
  guiamento: Activity,
  transporte: Car,
  alimentacao: Utensils,
  atividade: Plane,
  outros: Building2
}

const tipoColors: Record<TipoFornecedor, string> = {
  hotelaria: 'bg-blue-100 text-blue-700 border-blue-200',
  guiamento: 'bg-green-100 text-green-700 border-green-200',
  transporte: 'bg-purple-100 text-purple-700 border-purple-200',
  alimentacao: 'bg-orange-100 text-orange-700 border-orange-200',
  atividade: 'bg-pink-100 text-pink-700 border-pink-200',
  outros: 'bg-gray-100 text-gray-700 border-gray-200'
}

export default function FornecedoresPage() {
  const router = useRouter()
  const { data: fornecedores, refetch, loading } = useApi<Fornecedor[]>('/api/fornecedores')
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [tipoFilter, setTipoFilter] = useState<TipoFornecedor | 'todos'>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filtros e busca
  const filteredFornecedores = useMemo(() => {
    let result = fornecedores || []
    
    // Filtro por tipo
    if (tipoFilter !== 'todos') {
      result = result.filter(f => f.tipo === tipoFilter)
    }
    
    // Busca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f =>
        f.nomeFantasia.toLowerCase().includes(q) ||
        f.razaoSocial?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q) ||
        f.telefone?.toLowerCase().includes(q) ||
        f.documento?.toLowerCase().includes(q)
      )
    }
    
    return result.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia))
  }, [fornecedores, searchQuery, tipoFilter])

  // Estatísticas
  const stats = useMemo(() => {
    const all = fornecedores || []
    return {
      total: all.length,
      porTipo: {
        hotelaria: all.filter(f => f.tipo === 'hotelaria').length,
        guiamento: all.filter(f => f.tipo === 'guiamento').length,
        transporte: all.filter(f => f.tipo === 'transporte').length,
        alimentacao: all.filter(f => f.tipo === 'alimentacao').length,
        atividade: all.filter(f => f.tipo === 'atividade').length,
        outros: all.filter(f => f.tipo === 'outros').length,
      }
    }
  }, [fornecedores])

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir o fornecedor "${nome}"?`)) return
    
    try {
      const res = await fetch(`/api/fornecedores/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir')
      }
      
      await refetch()
      toast({ title: 'Sucesso', description: 'Fornecedor excluído com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro ao excluir fornecedor', variant: 'destructive' })
    }
  }

  const handleEdit = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedFornecedor(null)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedFornecedor(null)
    refetch()
  }

  const getTipoIcon = (tipo: TipoFornecedor) => {
    const Icon = tipoIcons[tipo]
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-gray-600 mt-1">Gerencie sua rede de fornecedores e parceiros</p>
        </div>
        <Button onClick={handleNew} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${tipoFilter === 'todos' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setTipoFilter('todos')}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>

        {(Object.keys(tipoLabels) as TipoFornecedor[]).map(tipo => {
          const Icon = tipoIcons[tipo]
          return (
            <Card 
              key={tipo}
              className={`cursor-pointer transition-all hover:shadow-md ${tipoFilter === tipo ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setTipoFilter(tipo)}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-2xl font-bold">{stats.porTipo[tipo]}</p>
                  <p className="text-sm text-gray-600">{tipoLabels[tipo]}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, email, telefone, documento..."
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Building2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {tipoFilter !== 'todos' && (
            <div className="mt-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtrado por:</span>
              <Badge className={tipoColors[tipoFilter]}>
                {getTipoIcon(tipoFilter)}
                <span className="ml-1">{tipoLabels[tipoFilter]}</span>
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTipoFilter('todos')}
                className="h-6 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fornecedores List/Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando fornecedores...</p>
        </div>
      ) : filteredFornecedores.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-lg">Nenhum fornecedor encontrado</p>
              <p className="text-sm mt-1">
                {searchQuery || tipoFilter !== 'todos' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Adicione seu primeiro fornecedor clicando no botão acima'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFornecedores.map(fornecedor => (
            <Card key={fornecedor.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{fornecedor.nomeFantasia}</CardTitle>
                    {fornecedor.razaoSocial && (
                      <CardDescription className="truncate">{fornecedor.razaoSocial}</CardDescription>
                    )}
                  </div>
                  <Badge className={`${tipoColors[fornecedor.tipo]} ml-2 flex-shrink-0`}>
                    {getTipoIcon(fornecedor.tipo)}
                    <span className="ml-1">{tipoLabels[fornecedor.tipo]}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {fornecedor.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{fornecedor.email}</span>
                  </div>
                )}
                {fornecedor.telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{fornecedor.telefone}</span>
                  </div>
                )}
                {fornecedor.documento && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span>{fornecedor.documento}</span>
                  </div>
                )}
                {fornecedor.endereco?.cidade && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {fornecedor.endereco.cidade}
                      {fornecedor.endereco.estado && `, ${fornecedor.endereco.estado}`}
                    </span>
                  </div>
                )}
                
                <div className="pt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/fornecedores/${fornecedor.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(fornecedor)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(fornecedor.id, fornecedor.nomeFantasia)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredFornecedores.map(fornecedor => (
                <div key={fornecedor.id} className="p-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${tipoColors[fornecedor.tipo]}`}>
                      {getTipoIcon(fornecedor.tipo)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{fornecedor.nomeFantasia}</h3>
                          {fornecedor.razaoSocial && (
                            <p className="text-sm text-gray-600">{fornecedor.razaoSocial}</p>
                          )}
                        </div>
                        <Badge className={tipoColors[fornecedor.tipo]}>
                          {tipoLabels[fornecedor.tipo]}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        {fornecedor.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{fornecedor.email}</span>
                          </div>
                        )}
                        {fornecedor.telefone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{fornecedor.telefone}</span>
                          </div>
                        )}
                        {fornecedor.documento && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span>{fornecedor.documento}</span>
                          </div>
                        )}
                        {fornecedor.endereco?.cidade && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {fornecedor.endereco.cidade}
                              {fornecedor.endereco.estado && `, ${fornecedor.endereco.estado}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/fornecedores/${fornecedor.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(fornecedor)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(fornecedor.id, fornecedor.nomeFantasia)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <FornecedorFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fornecedor={selectedFornecedor}
      />
    </div>
  )
}
