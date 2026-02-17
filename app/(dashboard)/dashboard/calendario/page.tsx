"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorMessage } from '@/components/ui/error-message'
import { useApi } from '@/hooks/useApi'
import { Calendar, ChevronLeft, ChevronRight, List, Grid3x3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CalendarEvent {
  id: string
  title: string
  start: string | Date
  end?: string | Date
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  extendedProps?: {
    type: string
    osId: string
    status?: string
    destino?: string
    participantes?: number
    agente?: string
    osTitulo?: string
    localizacao?: string
    hotel?: string
    tipoTransporte?: string
    origem?: string
    subtype?: string
  }
}

export default function CalendarioPage() {
  const router = useRouter()
  const calendarRef = useRef<FullCalendar>(null)
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth')
  const [currentDate, setCurrentDate] = useState(new Date())
  const { data: eventos, loading, error, refetch } = useApi<CalendarEvent[]>('/api/calendario')

  // Filtros de tipo de evento
  const [filterEventTypes, setFilterEventTypes] = useState({
    os: true,
    atividade: true,
    hospedagem: true,
    transporte: true,
  })

  // Filtros de status
  const [filterStatus, setFilterStatus] = useState({
    planejamento: true,
    cotacoes: true,
    reservas_pendentes: true,
    reservas_confirmadas: true,
    em_andamento: true,
    concluida: true,
    cancelada: true,
  })

  // Filtrar eventos baseado nos filtros selecionados
  const filteredEventos = useMemo(() => {
    if (!eventos) return []
    
    return eventos.filter(evento => {
      const eventType = evento.extendedProps?.type
      const eventStatus = evento.extendedProps?.status
      
      // Filtrar por tipo de evento
      if (eventType && !filterEventTypes[eventType as keyof typeof filterEventTypes]) {
        return false
      }
      
      // Filtrar por status (apenas para eventos do tipo 'os')
      if (eventType === 'os' && eventStatus && !filterStatus[eventStatus as keyof typeof filterStatus]) {
        return false
      }
      
      return true
    })
  }, [eventos, filterEventTypes, filterStatus])

  const handleEventClick = (clickInfo: any) => {
    const { osId } = clickInfo.event.extendedProps
    if (osId) {
      router.push(`/dashboard/os/${osId}`)
    }
  }

  const handleDateClick = (arg: any) => {
    console.log('Data clicada:', arg.dateStr)
  }

  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.prev()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.next()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.today()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const handleViewChange = (view: 'dayGridMonth' | 'timeGridWeek' | 'listWeek') => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.changeView(view)
      setCurrentView(view)
    }
  }

  const getViewTitle = () => {
    const calendarApi = calendarRef.current?.getApi()
    return calendarApi?.view.title || ''
  }

  if (loading) {
    return <CalendarioSkeleton />
  }

  if (error) {
    return (
      <ErrorMessage
        title="Erro ao carregar calendário"
        message={error}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Calendário
          </h1>
          <p className="text-gray-600 mt-2">
            Visualize todos os tours e atividades organizados por data
          </p>
        </div>
      </div>

      {/* Controles do Calendário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold ml-4">
                {getViewTitle()}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('dayGridMonth')}
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Mês
              </Button>
              <Button
                variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('timeGridWeek')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Semana
              </Button>
              <Button
                variant={currentView === 'listWeek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('listWeek')}
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              locale={ptBrLocale}
              headerToolbar={false}
              events={filteredEventos || []}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              height="auto"
              eventDisplay="block"
              displayEventTime={true}
              displayEventEnd={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
              dayMaxEvents={3}
              moreLinkText="mais"
              nowIndicator={true}
              navLinks={true}
              editable={false}
              selectable={true}
              selectMirror={true}
              weekends={true}
              eventContent={(eventInfo) => {
                return (
                  <div className="px-1 py-0.5 overflow-hidden leading-tight">
                    <div className="font-medium text-xs truncate whitespace-nowrap">
                      {eventInfo.event.title}
                    </div>
                  </div>
                )
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legenda Interativa com Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros & Legenda</CardTitle>
          <CardDescription>Clique nos itens abaixo para mostrar/ocultar no calendário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipos de Evento */}
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-700">Tipos de Evento</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setFilterEventTypes({ ...filterEventTypes, os: !filterEventTypes.os })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterEventTypes.os ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-sm">Tours / OS</span>
                  {filterEventTypes.os && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterEventTypes.os && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
                <button
                  onClick={() => setFilterEventTypes({ ...filterEventTypes, atividade: !filterEventTypes.atividade })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterEventTypes.atividade ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-sm">🎯 Atividades</span>
                  {filterEventTypes.atividade && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterEventTypes.atividade && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
                <button
                  onClick={() => setFilterEventTypes({ ...filterEventTypes, hospedagem: !filterEventTypes.hospedagem })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterEventTypes.hospedagem ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
                  <span className="text-sm">🏨 Hospedagens</span>
                  {filterEventTypes.hospedagem && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterEventTypes.hospedagem && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
                <button
                  onClick={() => setFilterEventTypes({ ...filterEventTypes, transporte: !filterEventTypes.transporte })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterEventTypes.transporte ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span className="text-sm">🚗 Transportes</span>
                  {filterEventTypes.transporte && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterEventTypes.transporte && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
              </div>
            </div>

            {/* Status dos Tours */}
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-700">Status dos Tours</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setFilterStatus({ ...filterStatus, planejamento: !filterStatus.planejamento })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterStatus.planejamento ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b7280' }}></div>
                  <span className="text-sm">Planejamento</span>
                  {filterStatus.planejamento && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterStatus.planejamento && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
                <button
                  onClick={() => setFilterStatus({ ...filterStatus, cotacoes: !filterStatus.cotacoes })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterStatus.cotacoes ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-sm">Cotações</span>
                  {filterStatus.cotacoes && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterStatus.cotacoes && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
                <button
                  onClick={() => setFilterStatus({ ...filterStatus, reservas_pendentes: !filterStatus.reservas_pendentes })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterStatus.reservas_pendentes ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }}></div>
                  <span className="text-sm">Reservas Pendentes</span>
                  {filterStatus.reservas_pendentes && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterStatus.reservas_pendentes && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
                <button
                  onClick={() => setFilterStatus({ ...filterStatus, reservas_confirmadas: !filterStatus.reservas_confirmadas })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterStatus.reservas_confirmadas ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                  <span className="text-sm">Reservas Confirmadas</span>
                  {filterStatus.reservas_confirmadas && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterStatus.reservas_confirmadas && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
                <button
                  onClick={() => setFilterStatus({ ...filterStatus, em_andamento: !filterStatus.em_andamento })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterStatus.em_andamento ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ec4899' }}></div>
                  <span className="text-sm">Em Andamento</span>
                  {filterStatus.em_andamento && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterStatus.em_andamento && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
                <button
                  onClick={() => setFilterStatus({ ...filterStatus, concluida: !filterStatus.concluida })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterStatus.concluida ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-sm">Concluída</span>
                  {filterStatus.concluida && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterStatus.concluida && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
                <button
                  onClick={() => setFilterStatus({ ...filterStatus, cancelada: !filterStatus.cancelada })}
                  className={`flex items-center gap-2 p-2 rounded-md transition-all hover:bg-gray-100 ${
                    !filterStatus.cancelada ? 'opacity-40 line-through' : ''
                  }`}
                >
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                  <span className="text-sm">Cancelada</span>
                  {filterStatus.cancelada && <span className="ml-auto text-xs text-green-600">✓ Visível</span>}
                  {!filterStatus.cancelada && <span className="ml-auto text-xs text-gray-400">✗ Oculto</span>}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CalendarioSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-7 w-40 ml-4" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
