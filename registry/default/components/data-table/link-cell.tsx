"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { NullValue } from "@/registry/default/ui/null-value"

interface LinkCellProps {
  href: string | null
  children: React.ReactNode
  className?: string
}

export function LinkCell({ href, children, className }: LinkCellProps) {
  if (!href) {
    return <NullValue />
  }

  return (
    <Link
      href={href}
      className={cn("text-primary truncate hover:underline", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  )
}
