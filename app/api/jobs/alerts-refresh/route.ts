/**
 * API de Gerenciamento do Job de Alertas
 *
 * POST /api/jobs/alerts-refresh - Inicia o job
 * DELETE /api/jobs/alerts-refresh - Para o job
 * GET /api/jobs/alerts-refresh - Status e logs do job
 * POST /api/jobs/alerts-refresh/execute - Executa o job uma vez
 */

import { NextRequest, NextResponse } from 'next/server'
import { alertsRefreshJob } from '@/lib/jobs/alerts-refresh-job'

// POST - Iniciar job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const intervalMinutes = body.intervalMinutes || 60

    alertsRefreshJob.start(intervalMinutes)

    return NextResponse.json({
      message: 'Job iniciado com sucesso',
      intervalMinutes,
    })
  } catch (error) {
    console.error('[API AlertsRefreshJob] Erro ao iniciar job:', error)
    return NextResponse.json(
      { error: 'Erro ao iniciar job' },
      { status: 500 }
    )
  }
}

// DELETE - Parar job
export async function DELETE() {
  try {
    alertsRefreshJob.stop()

    return NextResponse.json({
      message: 'Job parado com sucesso',
    })
  } catch (error) {
    console.error('[API AlertsRefreshJob] Erro ao parar job:', error)
    return NextResponse.json({ error: 'Erro ao parar job' }, { status: 500 })
  }
}

// GET - Status e logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const logsLimit = parseInt(searchParams.get('logsLimit') || '10')

    const status = alertsRefreshJob.getStatus()
    const logs = alertsRefreshJob.getExecutionLogs(logsLimit)

    return NextResponse.json({
      status,
      logs,
    })
  } catch (error) {
    console.error('[API AlertsRefreshJob] Erro ao obter status:', error)
    return NextResponse.json(
      { error: 'Erro ao obter status' },
      { status: 500 }
    )
  }
}
