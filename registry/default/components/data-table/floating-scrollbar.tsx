"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FloatingScrollbarProps {
  show: boolean
  tableWidth: number
  containerRect: { left: number; width: number } | null
  onScroll: () => void
  scrollBarRef: React.RefObject<HTMLDivElement | null>
}

export function FloatingScrollbar({
  show,
  tableWidth,
  containerRect,
  onScroll,
  scrollBarRef,
}: FloatingScrollbarProps) {
  // Don't render if no horizontal overflow
  const hasOverflow = containerRect && tableWidth > containerRect.width

  if (!hasOverflow) return null

  return (
    <div
      ref={scrollBarRef}
      aria-hidden="true"
      className={cn(
        "fixed bottom-0 z-40",
        "overflow-x-auto overflow-y-hidden",
        "bg-background/80 border-t backdrop-blur-sm",
        "transition-opacity duration-200",
        show ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      style={{
        left: containerRect.left,
        width: containerRect.width,
        height: 16,
      }}
      onScroll={onScroll}
    >
      <div
        style={{
          width: tableWidth,
          height: 1,
        }}
      />
    </div>
  )
}
