/**
 * API para executar o job de alertas uma única vez
 *
 * POST /api/jobs/alerts-refresh/execute - Executa o job imediatamente
 */

import { NextResponse } from 'next/server'
import { alertsRefreshJob } from '@/lib/jobs/alerts-refresh-job'

export async function POST() {
  try {
    const result = await alertsRefreshJob.execute()

    return NextResponse.json({
      message: 'Job executado com sucesso',
      result,
    })
  } catch (error) {
    console.error('[API AlertsRefreshJob Execute] Erro ao executar job:', error)
    return NextResponse.json(
      { error: 'Erro ao executar job' },
      { status: 500 }
    )
  }
}
