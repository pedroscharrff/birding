"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, File, FileText, Image as ImageIcon, Download, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  url: string
  key: string
  fileName: string
  contentType: string
  size: number
  uploadedAt: Date
}

interface FileUploadProps {
  folder: string
  entityId: string
  existingFiles?: UploadedFile[]
  onFilesChange?: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  disabled?: boolean
  className?: string
}

export function FileUpload({
  folder,
  entityId,
  existingFiles = [],
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = 20,
  acceptedTypes = ['*'],
  disabled = false,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    // Verificar limite de arquivos
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        // Validar tamanho
        if (file.size > maxSizeMB * 1024 * 1024) {
          throw new Error(`Arquivo ${file.name} excede ${maxSizeMB}MB`)
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)
        formData.append('entityId', entityId)

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro ao fazer upload')
        }

        const data = await response.json()
        return {
          ...data.file,
          fileName: file.name,
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      const newFiles = [...files, ...uploadedFiles]
      setFiles(newFiles)
      onFilesChange?.(newFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveFile = async (fileKey: string) => {
    try {
      const response = await fetch('/api/storage/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erro ao deletar arquivo')
      }

      const newFiles = files.filter((f) => f.key !== fileKey)
      setFiles(newFiles)
      onFilesChange?.(newFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar arquivo')
    }
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
    if (contentType.includes('pdf')) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={disabled || uploading || files.length >= maxFiles}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || files.length >= maxFiles}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Enviando...' : 'Adicionar Arquivos'}
        </Button>
        <p className="text-xs text-gray-500 mt-1">
          Máximo: {maxFiles} arquivos, {maxSizeMB}MB cada
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Arquivos ({files.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.key}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-shrink-0 text-gray-600">
                  {getFileIcon(file.contentType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                    title="Baixar arquivo"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.key)}
                    disabled={disabled}
                    title="Remover arquivo"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
