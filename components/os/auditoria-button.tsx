'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'

interface Props {
  osId: string
  variant?: 'button' | 'link'
  className?: string
}

export function AuditoriaButton({ osId, variant = 'button', className = '' }: Props) {
  if (variant === 'link') {
    return (
      <Link
        href={`/dashboard/os/${osId}/auditoria`}
        className={`flex items-center gap-2 text-sm text-primary hover:underline ${className}`}
      >
        <FileText className="w-4 h-4" />
        Ver Auditoria
      </Link>
    )
  }

  return (
    <Link
      href={`/dashboard/os/${osId}/auditoria`}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition ${className}`}
    >
      <FileText className="w-4 h-4" />
      Auditoria
    </Link>
  )
}
