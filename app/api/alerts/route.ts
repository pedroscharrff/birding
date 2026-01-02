/**
 * API de Alertas
 *
 * GET /api/alerts - Retorna alertas da organização (com paginação e cache)
 * GET /api/alerts/count - Retorna apenas os contadores (super rápido)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAlertsPaginated, getAlertsCount } from '@/lib/services/alerts-paginated'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // TODO: Obter orgId do usuário autenticado
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId é obrigatório' },
        { status: 400 }
      )
    }

    // Parâmetros de paginação e filtros
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const severity = searchParams.get('severity') as 'critical' | 'warning' | 'info' | null
    const category = searchParams.get('category')
    const osId = searchParams.get('osId')
    const countOnly = searchParams.get('countOnly') === 'true'

    // Se apenas contadores são necessários, usar função otimizada
    if (countOnly) {
      const count = await getAlertsCount(orgId)
      return NextResponse.json({ count })
    }

    // Buscar alertas paginados
    const response = await getAlertsPaginated({
      orgId,
      page,
      pageSize,
      severity: severity || undefined,
      category: category || undefined,
      osId: osId || undefined,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('[API Alerts] Erro ao buscar alertas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar alertas' },
      { status: 500 }
    )
  }
}
