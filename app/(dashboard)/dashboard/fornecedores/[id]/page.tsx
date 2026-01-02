"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useApi } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import { 
  ArrowLeft,
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Pencil,
  Building,
  Utensils,
  Car,
  Plane,
  Activity
} from 'lucide-react'
import { FornecedorFormDialog } from '@/components/forms/FornecedorFormDialog'
import { TarifasManager } from '@/components/forms/TarifasManager'

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

export default function FornecedorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { data: fornecedor, refetch, loading } = useApi<Fornecedor>(`/api/fornecedores/${params.id}`)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleDialogClose = () => {
    setDialogOpen(false)
    refetch()
  }

  const getTipoIcon = (tipo: TipoFornecedor) => {
    const Icon = tipoIcons[tipo]
    return <Icon className="h-5 w-5" />
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando fornecedor...</p>
        </div>
      </div>
    )
  }

  if (!fornecedor) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-lg">Fornecedor não encontrado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/fornecedores')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{fornecedor.nomeFantasia}</h1>
              <Badge className={tipoColors[fornecedor.tipo]}>
                {getTipoIcon(fornecedor.tipo)}
                <span className="ml-1">{tipoLabels[fornecedor.tipo]}</span>
              </Badge>
            </div>
            {fornecedor.razaoSocial && (
              <p className="text-gray-600 mt-1">{fornecedor.razaoSocial}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Pencil className="h-4 w-4" />
          Editar Fornecedor
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Fornecedor */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fornecedor.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600">E-mail</p>
                    <p className="font-medium truncate">{fornecedor.email}</p>
                  </div>
                </div>
              )}
              {fornecedor.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium">{fornecedor.telefone}</p>
                  </div>
                </div>
              )}
              {fornecedor.documento && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">CPF/CNPJ</p>
                    <p className="font-medium">{fornecedor.documento}</p>
                  </div>
                </div>
              )}
              {!fornecedor.email && !fornecedor.telefone && !fornecedor.documento && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma informação de contato cadastrada
                </p>
              )}
            </CardContent>
          </Card>

          {/* Endereço */}
          {fornecedor.endereco && Object.values(fornecedor.endereco).some(v => v) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {fornecedor.endereco.logradouro && (
                    <p>
                      {fornecedor.endereco.logradouro}
                      {fornecedor.endereco.numero && `, ${fornecedor.endereco.numero}`}
                    </p>
                  )}
                  {fornecedor.endereco.complemento && (
                    <p className="text-gray-600">{fornecedor.endereco.complemento}</p>
                  )}
                  {fornecedor.endereco.bairro && (
                    <p>{fornecedor.endereco.bairro}</p>
                  )}
                  {(fornecedor.endereco.cidade || fornecedor.endereco.estado) && (
                    <p>
                      {fornecedor.endereco.cidade}
                      {fornecedor.endereco.estado && ` - ${fornecedor.endereco.estado}`}
                    </p>
                  )}
                  {fornecedor.endereco.cep && (
                    <p className="text-gray-600">CEP: {fornecedor.endereco.cep}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {fornecedor.obs && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{fornecedor.obs}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tarifas */}
        <div className="lg:col-span-2">
          <TarifasManager fornecedorId={params.id} />
        </div>
      </div>

      {/* Dialog */}
      <FornecedorFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fornecedor={fornecedor}
      />
    </div>
  )
}
