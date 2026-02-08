import { minioClient, BUCKET_NAME, initializeBucket } from './minio'
import { Readable } from 'stream'

export interface UploadFileOptions {
  folder: string // Ex: 'participantes', 'pagamentos', 'fornecedores'
  entityId: string // ID da entidade relacionada
  fileName: string
  contentType: string
  metadata?: Record<string, string>
}

export interface FileMetadata {
  url: string
  key: string
  size: number
  contentType: string
  uploadedAt: Date
}

/**
 * Gera uma chave única para o arquivo no formato: folder/entityId/timestamp-filename
 */
function generateFileKey(folder: string, entityId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${folder}/${entityId}/${timestamp}-${sanitizedFileName}`
}

/**
 * Faz upload de um arquivo para o MinIO
 */
export async function uploadFile(
  file: Buffer | Readable,
  options: UploadFileOptions
): Promise<FileMetadata> {
  try {
    // Garantir que o bucket existe
    await initializeBucket()

    const fileKey = generateFileKey(options.folder, options.entityId, options.fileName)
    
    const metadata: Record<string, string> = {
      'Content-Type': options.contentType,
      ...options.metadata,
    }

    // Upload do arquivo
    if (Buffer.isBuffer(file)) {
      await minioClient.putObject(BUCKET_NAME, fileKey, file, file.length, metadata)
    } else {
      // Para streams, não passamos metadata no putObject
      await minioClient.putObject(BUCKET_NAME, fileKey, file)
    }

    // Gerar URL pública
    const publicUrl = `${process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL}/${BUCKET_NAME}/${fileKey}`

    const stat = await minioClient.statObject(BUCKET_NAME, fileKey)

    return {
      url: publicUrl,
      key: fileKey,
      size: stat.size,
      contentType: options.contentType,
      uploadedAt: new Date(),
    }
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error)
    throw new Error('Falha ao fazer upload do arquivo')
  }
}

/**
 * Faz upload de múltiplos arquivos
 */
export async function uploadMultipleFiles(
  files: Array<{ buffer: Buffer; fileName: string; contentType: string }>,
  folder: string,
  entityId: string
): Promise<FileMetadata[]> {
  const uploadPromises = files.map((file) =>
    uploadFile(file.buffer, {
      folder,
      entityId,
      fileName: file.fileName,
      contentType: file.contentType,
    })
  )

  return Promise.all(uploadPromises)
}

/**
 * Baixa um arquivo do MinIO
 */
export async function downloadFile(fileKey: string): Promise<Readable> {
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, fileKey)
    return stream
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error)
    throw new Error('Falha ao baixar arquivo')
  }
}

/**
 * Deleta um arquivo do MinIO
 */
export async function deleteFile(fileKey: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileKey)
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    throw new Error('Falha ao deletar arquivo')
  }
}

/**
 * Deleta múltiplos arquivos
 */
export async function deleteMultipleFiles(fileKeys: string[]): Promise<void> {
  try {
    await minioClient.removeObjects(BUCKET_NAME, fileKeys)
  } catch (error) {
    console.error('Erro ao deletar arquivos:', error)
    throw new Error('Falha ao deletar arquivos')
  }
}

/**
 * Lista arquivos de uma entidade específica
 */
export async function listEntityFiles(folder: string, entityId: string): Promise<FileMetadata[]> {
  try {
    const prefix = `${folder}/${entityId}/`
    const files: FileMetadata[] = []

    const stream = minioClient.listObjectsV2(BUCKET_NAME, prefix, true)

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          const publicUrl = `${process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL}/${BUCKET_NAME}/${obj.name}`
          files.push({
            url: publicUrl,
            key: obj.name,
            size: obj.size,
            contentType: 'application/octet-stream',
            uploadedAt: obj.lastModified,
          })
        }
      })

      stream.on('end', () => resolve(files))
      stream.on('error', reject)
    })
  } catch (error) {
    console.error('Erro ao listar arquivos:', error)
    throw new Error('Falha ao listar arquivos')
  }
}

/**
 * Gera URL pré-assinada para download temporário (expira em X segundos)
 */
export async function generatePresignedUrl(
  fileKey: string,
  expirySeconds: number = 3600
): Promise<string> {
  try {
    return await minioClient.presignedGetObject(BUCKET_NAME, fileKey, expirySeconds)
  } catch (error) {
    console.error('Erro ao gerar URL pré-assinada:', error)
    throw new Error('Falha ao gerar URL de download')
  }
}

/**
 * Gera URL pré-assinada para upload direto do cliente
 */
export async function generatePresignedUploadUrl(
  fileKey: string,
  expirySeconds: number = 3600
): Promise<string> {
  try {
    return await minioClient.presignedPutObject(BUCKET_NAME, fileKey, expirySeconds)
  } catch (error) {
    console.error('Erro ao gerar URL de upload:', error)
    throw new Error('Falha ao gerar URL de upload')
  }
}

/**
 * Copia um arquivo de uma localização para outra
 */
export async function copyFile(sourceKey: string, destinationKey: string): Promise<void> {
  try {
    await minioClient.copyObject(
      BUCKET_NAME,
      destinationKey,
      `/${BUCKET_NAME}/${sourceKey}`,
      undefined
    )
  } catch (error) {
    console.error('Erro ao copiar arquivo:', error)
    throw new Error('Falha ao copiar arquivo')
  }
}

/**
 * Obtém metadados de um arquivo
 */
export async function getFileMetadata(fileKey: string): Promise<FileMetadata> {
  try {
    const stat = await minioClient.statObject(BUCKET_NAME, fileKey)
    const publicUrl = `${process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL}/${BUCKET_NAME}/${fileKey}`

    return {
      url: publicUrl,
      key: fileKey,
      size: stat.size,
      contentType: stat.metaData['content-type'] || 'application/octet-stream',
      uploadedAt: stat.lastModified,
    }
  } catch (error) {
    console.error('Erro ao obter metadados do arquivo:', error)
    throw new Error('Falha ao obter informações do arquivo')
  }
}

/**
 * Valida tipo de arquivo
 */
export function validateFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (!extension) return false
  
  // Primeiro, verificar se é um tipo bloqueado (executáveis)
  if (ALLOWED_FILE_TYPES.blocked.includes(extension)) {
    return false
  }
  
  // Depois, verificar se está na lista de permitidos
  return allowedTypes.includes(extension)
}

/**
 * Valida tamanho do arquivo (em bytes)
 */
export function validateFileSize(size: number, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return size <= maxSizeInBytes
}

/**
 * Tipos de arquivo permitidos por categoria
 */
export const ALLOWED_FILE_TYPES = {
  documents: ['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf', 'pages'],
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico', 'heic', 'heif'],
  spreadsheets: ['xls', 'xlsx', 'csv', 'ods', 'numbers'],
  presentations: ['ppt', 'pptx', 'odp', 'key'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
  code: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'html', 'css', 'scss', 'sass', 'less', 'json', 'xml', 'yaml', 'yml', 'md', 'sql'],
  data: ['json', 'xml', 'yaml', 'yml', 'csv', 'tsv'],
  // Tipos bloqueados por segurança (executáveis)
  blocked: ['exe', 'bat', 'cmd', 'sh', 'msi', 'app', 'deb', 'rpm', 'dmg', 'pkg', 'run', 'bin', 'com', 'scr', 'vbs', 'js', 'jar'],
  all: [
    // Documentos
    'pdf', 'doc', 'docx', 'txt', 'odt', 'rtf', 'pages',
    // Imagens
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico', 'heic', 'heif',
    // Planilhas
    'xls', 'xlsx', 'csv', 'ods', 'numbers',
    // Apresentações
    'ppt', 'pptx', 'odp', 'key',
    // Áudio
    'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma',
    // Vídeo
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v',
    // Arquivos compactados
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz',
    // Código fonte (texto)
    'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'html', 'css', 'scss', 'sass', 'less', 'xml', 'yaml', 'yml', 'md', 'sql',
    // Dados
    'json', 'tsv',
  ],
}

/**
 * Tamanhos máximos recomendados (em MB)
 */
export const MAX_FILE_SIZES = {
  document: 10, // 10MB para documentos
  image: 5, // 5MB para imagens
  general: 20, // 20MB para arquivos gerais
}
