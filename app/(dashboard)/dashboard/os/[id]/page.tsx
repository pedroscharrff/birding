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
import { ArrowLeft, Edit, Trash2, Users, MapPin, Calendar, Building2, Plane, Truck, DollarSign, FileText, Compass } from 'lucide-react'
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
            <h1 className="text-3xl font-bold text-gray-900">{os.titulo}</h1>
            <div className="flex items-center gap-4 mt-2 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{os.destino}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(os.dataInicio), 'dd MMM', { locale: ptBR })} a{' '}
                  {format(new Date(os.dataFim), 'dd MMM yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OSStatusSelect
            osId={os.id}
            osTitulo={os.titulo}
            currentStatus={currentStatus || os.status}
            onStatusChange={(newStatus) => {
              setCurrentStatus(newStatus)
              // Atualizar apenas o histórico, sem refetch completo
              refetch()
            }}
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
            <div className="text-2xl font-bold">{os.participantes.length}</div>
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
            <div className="text-2xl font-bold">{os.guiasDesignacao.length}</div>
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
            <div className="text-2xl font-bold">{os.hospedagens.length}</div>
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
            <div className="text-2xl font-bold">{os.transportes.length}</div>
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
            <div className="text-2xl font-bold">{os.atividades.length}</div>
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
            <div className="text-2xl font-bold">{os.passagensAereas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
          <TabsTrigger value="participantes">
            Participantes ({os.participantes.length})
          </TabsTrigger>
          <TabsTrigger value="guias">
            <Compass className="h-4 w-4 mr-1" />
            Guias ({os.guiasDesignacao.length})
          </TabsTrigger>
          <TabsTrigger value="hospedagens">
            Hospedagens ({os.hospedagens.length})
          </TabsTrigger>
          <TabsTrigger value="transportes">
            Transportes ({os.transportes.length})
          </TabsTrigger>
          <TabsTrigger value="atividades">
            Atividades ({os.atividades.length})
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
          <OSInfoSection os={os} />
          {os.historicoStatus && os.historicoStatus.length > 0 && (
            <OSStatusHistory historico={os.historicoStatus} />
          )}
        </TabsContent>

        <TabsContent value="participantes" className="space-y-4">
          <OSParticipantesSection osId={osId} participantes={os.participantes} onUpdate={() => {}} />
        </TabsContent>

        <TabsContent value="guias" className="space-y-4">
          <OSGuiasSection osId={osId} guias={os.guiasDesignacao} onUpdate={refetch} />
        </TabsContent>

        <TabsContent value="hospedagens" className="space-y-4">
          <OSHospedagensSection osId={osId} hospedagens={os.hospedagens} onUpdate={() => {}} />
        </TabsContent>

        <TabsContent value="transportes" className="space-y-4">
          <OSTransportesSection osId={osId} transportes={os.transportes} onUpdate={() => {}} />
        </TabsContent>

        <TabsContent value="atividades" className="space-y-4">
          <OSAtividadesSection osId={osId} atividades={os.atividades.filter((a: any) => a.tipo === 'atividade')} onUpdate={() => {}} />
        </TabsContent>

        <TabsContent value="alimentacao" className="space-y-4">
          <OSAlimentacaoSection osId={osId} alimentacoes={os.atividades.filter((a: any) => a.tipo === 'alimentacao')} onUpdate={() => {}} />
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
