import { NextRequest, NextResponse } from 'next/server'
import { deleteFile } from '@/lib/storage/storage-service'
import { getSession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * DELETE /api/storage/delete
 * Deletar arquivo do MinIO S3
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { fileKey } = await request.json()

    if (!fileKey) {
      return NextResponse.json(
        { error: 'Chave do arquivo é obrigatória' },
        { status: 400 }
      )
    }

    // Deletar arquivo
    await deleteFile(fileKey)

    return NextResponse.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar arquivo' },
      { status: 500 }
    )
  }
}
