import { NextRequest, NextResponse } from 'next/server'
import { listEntityFiles } from '@/lib/storage/storage-service'
import { getSession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/storage/list?folder=xxx&entityId=xxx
 * Listar arquivos de uma entidade
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder')
    const entityId = searchParams.get('entityId')

    if (!folder || !entityId) {
      return NextResponse.json(
        { error: 'Pasta e ID da entidade são obrigatórios' },
        { status: 400 }
      )
    }

    // Listar arquivos
    const files = await listEntityFiles(folder, entityId)

    return NextResponse.json({
      success: true,
      files,
    })
  } catch (error) {
    console.error('Erro ao listar arquivos:', error)
    return NextResponse.json(
      { error: 'Erro ao listar arquivos' },
      { status: 500 }
    )
  }
}
