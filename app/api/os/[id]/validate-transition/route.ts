/**
 * API de Validação de Transição de Status
 * 
 * POST /api/os/[id]/validate-transition - Valida se pode mudar de status
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateStatusTransition } from '@/lib/services/status-validation'
import { StatusOS } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { fromStatus, toStatus } = body

    if (!fromStatus || !toStatus) {
      return NextResponse.json(
        { error: 'fromStatus e toStatus são obrigatórios' },
        { status: 400 }
      )
    }

    const validation = await validateStatusTransition(
      params.id,
      fromStatus as StatusOS,
      toStatus as StatusOS
    )

    return NextResponse.json(validation)
  } catch (error) {
    console.error('[API Validate Transition] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao validar transição' },
      { status: 500 }
    )
  }
}
