import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, validateFileType, validateFileSize, ALLOWED_FILE_TYPES, MAX_FILE_SIZES } from '@/lib/storage/storage-service'
import { getSession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface UploadRequestBody {
  folder: string
  entityId: string
  fileName: string
  contentType: string
  metadata?: Record<string, string>
}

/**
 * POST /api/storage/upload
 * Upload de arquivo para o MinIO S3
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    const entityId = formData.get('entityId') as string
    const metadata = formData.get('metadata') as string | null

    if (!file || !folder || !entityId) {
      return NextResponse.json(
        { error: 'Arquivo, pasta e ID da entidade são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!validateFileType(file.name, ALLOWED_FILE_TYPES.all)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo
    if (!validateFileSize(file.size, MAX_FILE_SIZES.general)) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZES.general}MB` },
        { status: 400 }
      )
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse metadata se fornecido
    const parsedMetadata = metadata ? JSON.parse(metadata) : {}

    // Upload do arquivo
    const fileMetadata = await uploadFile(buffer, {
      folder,
      entityId,
      fileName: file.name,
      contentType: file.type,
      metadata: {
        ...parsedMetadata,
        uploadedBy: session.userId,
        uploadedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      file: fileMetadata,
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}
