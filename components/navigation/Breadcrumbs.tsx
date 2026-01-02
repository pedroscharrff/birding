"use client"

import Link from 'next/link'

type Crumb = {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
      <ol className="flex items-center gap-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={idx} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-gray-900 text-gray-600">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                  {item.label}
                </span>
              )}
              {!isLast && <span className="text-gray-400">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
