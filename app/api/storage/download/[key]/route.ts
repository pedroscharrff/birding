import { NextRequest, NextResponse } from 'next/server'
import { downloadFile } from '@/lib/storage/storage-service'
import { getSession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/storage/download/[key]
 * Download de arquivo do MinIO S3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const fileKey = decodeURIComponent(params.key)

    if (!fileKey) {
      return NextResponse.json(
        { error: 'Chave do arquivo é obrigatória' },
        { status: 400 }
      )
    }

    // Baixar arquivo
    const stream = await downloadFile(fileKey)

    // Retornar stream como resposta
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileKey.split('/').pop()}"`,
      },
    })
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error)
    return NextResponse.json(
      { error: 'Erro ao baixar arquivo' },
      { status: 500 }
    )
  }
}
