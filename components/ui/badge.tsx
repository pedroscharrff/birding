import * as React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'warning'
  selected?: boolean
}

export function Badge({ className = '', variant = 'default', selected = false, ...props }: BadgeProps) {
  const base = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium cursor-pointer select-none transition-colors'
  const variants = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    secondary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    destructive: 'bg-red-100 text-red-800 hover:bg-red-200',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  } as const
  const selectedCls = selected ? ' ring-2 ring-blue-500 ring-offset-1' : ''
  return <span className={`${base} ${variants[variant]} ${selectedCls} ${className}`} {...props} />
}
