import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    // Buscar todas as OS com suas informações
    const whereClause: any = {
      orgId: session.orgId,
    }

    // Filtrar por período se fornecido
    if (start && end) {
      whereClause.OR = [
        {
          dataInicio: {
            gte: new Date(start),
            lte: new Date(end),
          },
        },
        {
          dataFim: {
            gte: new Date(start),
            lte: new Date(end),
          },
        },
        {
          AND: [
            { dataInicio: { lte: new Date(start) } },
            { dataFim: { gte: new Date(end) } },
          ],
        },
      ]
    }

    const osList = await prisma.oS.findMany({
      where: whereClause,
      include: {
        agenteResponsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        _count: {
          select: {
            participantes: true,
            atividades: true,
            hospedagens: true,
          },
        },
        atividades: {
          select: {
            id: true,
            nome: true,
            data: true,
            hora: true,
            localizacao: true,
          },
          where: {
            data: {
              not: null,
            },
          },
        },
        hospedagens: {
          select: {
            id: true,
            hotelNome: true,
            checkin: true,
            checkout: true,
          },
        },
        transportes: {
          select: {
            id: true,
            tipo: true,
            origem: true,
            destino: true,
            dataPartida: true,
            dataChegada: true,
          },
          where: {
            dataPartida: {
              not: null,
            },
          },
        },
      },
      orderBy: {
        dataInicio: 'asc',
      },
    })

    // Transformar OS em eventos do calendário
    const eventos = []

    for (const os of osList) {
      // Evento principal da OS (período completo)
      eventos.push({
        id: `os-${os.id}`,
        title: os.titulo,
        start: os.dataInicio,
        end: os.dataFim,
        allDay: true,
        backgroundColor: getColorByStatus(os.status),
        borderColor: getColorByStatus(os.status),
        extendedProps: {
          type: 'os',
          osId: os.id,
          status: os.status,
          destino: os.destino,
          participantes: os._count.participantes,
          agente: os.agenteResponsavel.nome,
        },
      })

      // Eventos de atividades
      for (const atividade of os.atividades) {
        if (atividade.data) {
          eventos.push({
            id: `atividade-${atividade.id}`,
            title: `🎯 ${atividade.nome}`,
            start: atividade.data,
            allDay: !atividade.hora,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            extendedProps: {
              type: 'atividade',
              osId: os.id,
              osTitulo: os.titulo,
              localizacao: atividade.localizacao,
            },
          })
        }
      }

      // Eventos de hospedagens
      for (const hospedagem of os.hospedagens) {
        eventos.push({
          id: `hospedagem-checkin-${hospedagem.id}`,
          title: `🏨 Check-in: ${hospedagem.hotelNome}`,
          start: hospedagem.checkin,
          allDay: false,
          backgroundColor: '#8b5cf6',
          borderColor: '#7c3aed',
          extendedProps: {
            type: 'hospedagem',
            subtype: 'checkin',
            osId: os.id,
            osTitulo: os.titulo,
            hotel: hospedagem.hotelNome,
          },
        })

        eventos.push({
          id: `hospedagem-checkout-${hospedagem.id}`,
          title: `🏨 Check-out: ${hospedagem.hotelNome}`,
          start: hospedagem.checkout,
          allDay: false,
          backgroundColor: '#8b5cf6',
          borderColor: '#7c3aed',
          extendedProps: {
            type: 'hospedagem',
            subtype: 'checkout',
            osId: os.id,
            osTitulo: os.titulo,
            hotel: hospedagem.hotelNome,
          },
        })
      }

      // Eventos de transportes
      for (const transporte of os.transportes) {
        if (transporte.dataPartida) {
          eventos.push({
            id: `transporte-${transporte.id}`,
            title: `🚗 ${transporte.origem || ''} → ${transporte.destino || ''}`,
            start: transporte.dataPartida,
            end: transporte.dataChegada || undefined,
            allDay: false,
            backgroundColor: '#f59e0b',
            borderColor: '#d97706',
            extendedProps: {
              type: 'transporte',
              osId: os.id,
              osTitulo: os.titulo,
              tipoTransporte: transporte.tipo,
              origem: transporte.origem,
              destino: transporte.destino,
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: eventos,
    })
  } catch (error) {
    console.error('Erro ao buscar eventos do calendário:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar eventos do calendário',
      },
      { status: 500 }
    )
  }
}

function getColorByStatus(status: string): string {
  const statusColors: Record<string, string> = {
    planejamento: '#6b7280',
    cotacoes: '#3b82f6',
    reservas_pendentes: '#eab308',
    reservas_confirmadas: '#22c55e',
    documentacao: '#06b6d4',
    pronto_para_viagem: '#8b5cf6',
    em_andamento: '#ec4899',
    concluida: '#10b981',
    pos_viagem: '#14b8a6',
    cancelada: '#ef4444',
  }

  return statusColors[status] || '#6b7280'
}
