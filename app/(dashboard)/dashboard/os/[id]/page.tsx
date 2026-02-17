"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorMessage } from '@/components/ui/error-message'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApi } from '@/hooks/useApi'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Edit, Trash2, Users, MapPin, Calendar, Building2, Plane, Truck, DollarSign, FileText, Compass, Utensils } from 'lucide-react'
import { OSInfoSection } from '@/components/os/OSInfoSection'
import { OSParticipantesSection } from '@/components/os/OSParticipantesSection'
import { OSGuiasSection } from '@/components/os/OSGuiasSection'
import { OSAtividadesSection } from '@/components/os/OSAtividadesSection'
import { OSHospedagensSection } from '@/components/os/OSHospedagensSection'
import { OSTransportesSection } from '@/components/os/OSTransportesSection'
import { OSAlimentacaoSection } from '@/components/os/OSAlimentacaoSection'
import { OSStatusSelect } from '@/components/os/OSStatusSelect'
import { OSStatusHistory } from '@/components/os/OSStatusHistory'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { AuditoriaButton } from '@/components/os/auditoria-button'
import { OSExtensionTimeline } from '@/components/os/OSExtensionTimeline'
import { OSExtensionManager } from '@/components/os/OSExtensionManager'

interface OSDetalhes {
  id: string
  titulo: string
  destino: string
  dataInicio: string
  dataFim: string
  status: string
  descricao?: string
  agenteResponsavel: {
    id: string
    nome: string
    email: string
    telefone?: string
  }
  participantes: any[]
  atividades: any[]
  hospedagens: any[]
  transportes: any[]
  passagensAereas: any[]
  guiasDesignacao: any[]
  motoristasDesignacao: any[]
  fornecedores: any[]
  anotacoes: any[]
  historicoStatus: any[]
  extensoes: any[]
}

export default function OSDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const osId = params.id as string

  const { data: os, loading, error, refetch } = useApi<OSDetalhes>(`/api/os/${osId}`, {
    autoFetch: true,
  })

  const [activeTab, setActiveTab] = useState('geral')
  const [currentStatus, setCurrentStatus] = useState(os?.status || '')
  
  // Extension Management State
  const [selectedExtensionId, setSelectedExtensionId] = useState<string | null>(null)
  const [isExtensionManagerOpen, setIsExtensionManagerOpen] = useState(false)

  // Sincronizar status inicial quando OS carrega
  useState(() => {
    if (os?.status) setCurrentStatus(os.status)
  })
  
  // Atualizar quando os mudar
  if (os?.status && currentStatus === '' && !loading) {
     setCurrentStatus(os.status)
  }
  const [extensionToEdit, setExtensionToEdit] = useState<any | null>(null)
  
  const currentExtension = selectedExtensionId 
    ? os?.extensoes?.find((e: any) => e.id === selectedExtensionId)
    : null;

  const handleOpenAddExtension = () => {
    setExtensionToEdit(null)
    setIsExtensionManagerOpen(true)
  }

  const handleOpenEditExtension = (ext: any) => {
    setExtensionToEdit(ext)
    setIsExtensionManagerOpen(true)
  }

  // Filter helper
  const filterByExtension = (items: any[]) => {
    if (!items) return []
    if (selectedExtensionId) {
      // Quando uma extensão está selecionada, mostrar APENAS os itens dessa extensão
      return items.filter((item: any) => item.extensaoId === selectedExtensionId)
    }
    // Quando "Visão Geral" está selecionada, mostrar APENAS itens do tour principal (sem extensão)
    return items.filter((item: any) => !item.extensaoId || item.extensaoId === null)
  }

  // Filter específico para histórico de status
  // O histórico usa extensaoId diretamente (não extensaoId como outros itens)
  const filterHistoricoByExtension = (historico: any[]) => {
    if (!historico) return []
    
    console.log('📋 Filtrando histórico:', {
      total: historico.length,
      selectedExtensionId,
      items: historico.map(h => ({
        id: h.id,
        extensaoId: h.extensaoId,
        de: h.de,
        para: h.para,
        extensaoNome: h.extensao?.nome
      }))
    })
    
    if (selectedExtensionId) {
      // Quando uma extensão está selecionada, mostrar APENAS histórico dessa extensão
      const filtered = historico.filter((item: any) => item.extensaoId === selectedExtensionId)
      console.log('📋 Histórico filtrado para extensão:', filtered.length)
      return filtered
    }
    
    // Quando "Visão Geral" está selecionada, mostrar APENAS histórico do tour principal
    const filtered = historico.filter((item: any) => !item.extensaoId || item.extensaoId === null)
    console.log('📋 Histórico filtrado para tour principal:', filtered.length)
    return filtered
  }

  const filteredParticipantes = selectedExtensionId 
    ? (os?.participantes || []).filter((p: any) => p.extensoes?.some((e: any) => e.id === selectedExtensionId))
    : (os?.participantes || [])

  const filteredGuias = filterByExtension(os?.guiasDesignacao || [])
  const filteredHospedagens = filterByExtension(os?.hospedagens || [])
  const filteredTransportes = filterByExtension(os?.transportes || [])
  const filteredAtividades = filterByExtension(os?.atividades || [])
  const filteredPassagens = filterByExtension(os?.passagensAereas || [])

  const handleStatusChange = (newStatus: string) => {
    if (!selectedExtensionId) {
      setCurrentStatus(newStatus)
    }
    // Atualizar dados após mudança
    refetch()
  }

  if (loading) {
    return <OSDetailsSkeleton />
  }

  if (error || !os) {
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
          title="Erro ao carregar OS"
          message={error || 'OS não encontrada'}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Operações', href: '/dashboard/os' },
          { label: os.titulo },
        ]}
      />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/dashboard/os">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedExtensionId ? currentExtension?.nome : os.titulo}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-gray-600">
              {!selectedExtensionId && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{os.destino}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {selectedExtensionId && currentExtension 
                    ? `${format(new Date(currentExtension.dataInicio), 'dd MMM', { locale: ptBR })} a ${format(new Date(currentExtension.dataFim), 'dd MMM yyyy', { locale: ptBR })}`
                    : `${format(new Date(os.dataInicio), 'dd MMM', { locale: ptBR })} a ${format(new Date(os.dataFim), 'dd MMM yyyy', { locale: ptBR })}`
                  }
                </span>
              </div>
              {selectedExtensionId && (
                <div className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  <span>Extensão do Tour</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            console.log('🎯 Renderizando OSStatusSelect:', {
              selectedExtensionId,
              extensaoNome: selectedExtensionId 
                ? os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.nome 
                : 'Tour Principal',
              status: selectedExtensionId 
                ? os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.status 
                : os.status
            })
            return null
          })()}
          <OSStatusSelect
            key={selectedExtensionId || 'os-main'} // Força remontagem ao trocar contexto
            osId={os.id}
            extensaoId={selectedExtensionId}
            osTitulo={selectedExtensionId 
              ? (os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.nome || 'Extensão')
              : os.titulo}
            currentStatus={selectedExtensionId 
              ? (os.extensoes?.find((e: any) => e.id === selectedExtensionId)?.status || 'planejamento')
              : (currentStatus || os.status)}
            onStatusChange={handleStatusChange}
            variant="badge"
            size="md"
          />
          <AuditoriaButton osId={osId as string} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <Users className="h-4 w-4 inline mr-2" />
              Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredParticipantes.length}</div>
            {selectedExtensionId && (
              <p className="text-xs text-gray-500 mt-1">desta extensão</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <Compass className="h-4 w-4 inline mr-2" />
              Guias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredGuias.length}</div>
            {selectedExtensionId && (
              <p className="text-xs text-gray-500 mt-1">desta extensão</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <Building2 className="h-4 w-4 inline mr-2" />
              Hospedagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredHospedagens.length}</div>
            {selectedExtensionId && (
              <p className="text-xs text-gray-500 mt-1">desta extensão</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <Truck className="h-4 w-4 inline mr-2" />
              Transportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransportes.length}</div>
            {selectedExtensionId && (
              <p className="text-xs text-gray-500 mt-1">desta extensão</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <MapPin className="h-4 w-4 inline mr-2" />
              Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAtividades.filter((a: any) => a.tipo === 'atividade' || !a.tipo).length}
            </div>
            {selectedExtensionId && (
              <p className="text-xs text-gray-500 mt-1">desta extensão</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <Utensils className="h-4 w-4 inline mr-2" />
              Alimentação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAtividades.filter((a: any) => a.tipo === 'alimentacao').length}
            </div>
            {selectedExtensionId && (
              <p className="text-xs text-gray-500 mt-1">desta extensão</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              <Plane className="h-4 w-4 inline mr-2" />
              Passagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPassagens.length}</div>
            {selectedExtensionId && (
              <p className="text-xs text-gray-500 mt-1">desta extensão</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Extensions Navigation */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Itinerário & Extensões</h2>
        </div>
        <OSExtensionTimeline
            extensoes={os.extensoes || []}
            selectedExtensionId={selectedExtensionId}
            onSelect={(id) => {
              console.log('🔄 Selecionando extensão:', id)
              setSelectedExtensionId(id)
            }}
            onAddExtension={handleOpenAddExtension}
            onEditExtension={handleOpenEditExtension}
        />

        <OSExtensionManager 
            osId={osId}
            open={isExtensionManagerOpen}
            onOpenChange={setIsExtensionManagerOpen}
            onSuccess={refetch}
            editingExtension={extensionToEdit} 
        />
      </div>

      {/* Main Tabs - Contextualized by Selected Extension */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
          <TabsTrigger value="participantes">
            Participantes ({filteredParticipantes.length})
          </TabsTrigger>
          <TabsTrigger value="guias">
            <Compass className="h-4 w-4 mr-1" />
            Guias ({filteredGuias.length})
          </TabsTrigger>
          <TabsTrigger value="hospedagens">
            Hospedagens ({filteredHospedagens.length})
          </TabsTrigger>
          <TabsTrigger value="transportes">
            Transportes ({filteredTransportes.length})
          </TabsTrigger>
          <TabsTrigger value="atividades">
            Atividades ({filteredAtividades.length})
          </TabsTrigger>
          <TabsTrigger value="alimentacao">
            Alimentação
          </TabsTrigger>
          <TabsTrigger value="financeiro">
            <DollarSign className="h-4 w-4 mr-1" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="auditoria">
            <FileText className="h-4 w-4 mr-1" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          {selectedExtensionId && currentExtension ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Detalhes da Extensão</CardTitle>
                    <CardDescription>Informações deste trecho da viagem</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditExtension(currentExtension)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Detalhes
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Nome</span>
                    <p className="text-lg font-medium">{currentExtension.nome}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <p className="text-lg font-medium capitalize">{currentExtension.status?.replace(/_/g, ' ') || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Data Início</span>
                    <p className="text-lg font-medium">{format(new Date(currentExtension.dataInicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Data Fim</span>
                    <p className="text-lg font-medium">{format(new Date(currentExtension.dataFim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                </div>
                {currentExtension.descricao && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Descrição</span>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{currentExtension.descricao}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <OSInfoSection os={os} onUpdate={refetch} />
          )}
          {filterHistoricoByExtension(os.historicoStatus || []).length > 0 && (
            <OSStatusHistory historico={filterHistoricoByExtension(os.historicoStatus || [])} />
          )}
        </TabsContent>

        <TabsContent value="participantes" className="space-y-4">
          <OSParticipantesSection 
            osId={osId} 
            participantes={filteredParticipantes} 
            onUpdate={() => {}} 
            extensaoId={selectedExtensionId}
          />
        </TabsContent>

        <TabsContent value="guias" className="space-y-4">
          {/* Note: We need to update OSGuiasSection to handle extensionId assignment */}
          <OSGuiasSection 
            osId={osId} 
            guias={filteredGuias} 
            onUpdate={refetch} 
            extensaoId={selectedExtensionId} 
          />
        </TabsContent>

        <TabsContent value="hospedagens" className="space-y-4">
          <OSHospedagensSection 
            osId={osId} 
            hospedagens={filteredHospedagens} 
            onUpdate={refetch} 
            extensaoId={selectedExtensionId} 
          />
        </TabsContent>

        <TabsContent value="transportes" className="space-y-4">
          <OSTransportesSection 
            osId={osId} 
            transportes={filteredTransportes} 
            onUpdate={refetch} 
            extensaoId={selectedExtensionId} 
          />
        </TabsContent>

        <TabsContent value="atividades" className="space-y-4">
          <OSAtividadesSection 
            osId={osId} 
            atividades={filteredAtividades.filter((a: any) => a.tipo === 'atividade' || !a.tipo)} 
            onUpdate={refetch} 
            extensaoId={selectedExtensionId}
          />
        </TabsContent>

        <TabsContent value="alimentacao" className="space-y-4">
          <OSAlimentacaoSection 
            osId={osId} 
            alimentacoes={filteredAtividades.filter((a: any) => a.tipo === 'alimentacao')} 
            onUpdate={refetch}
            extensaoId={selectedExtensionId}
          />
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle Financeiro</CardTitle>
              <CardDescription>
                Gerencie receitas, custos e pagamentos desta operação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Acesse a página dedicada de financeiro para visualizar e gerenciar todas as informações financeiras
                </p>
                <Link href={`/dashboard/os/${osId}/financeiro`}>
                  <Button>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Ir para Financeiro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria e Histórico</CardTitle>
              <CardDescription>
                Acompanhe todas as alterações realizadas nesta OS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Acesse a página dedicada de auditoria para visualizar o histórico completo de alterações
                </p>
                <Link href={`/dashboard/os/${osId}/auditoria`}>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Ir para Auditoria
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OSDetailsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <div className="flex-1">
          <Skeleton className="h-8 w-96 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
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
