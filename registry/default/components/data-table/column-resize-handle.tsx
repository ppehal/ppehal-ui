"use client"

import * as React from "react"
import { Header, Table } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import "@/registry/default/lib/table-types" // Extend ColumnMeta type

interface ColumnResizeHandleProps<TData> {
  header: Header<TData, unknown>
  table: Table<TData>
}

// Measure text width using canvas (faster than DOM measurement)
function measureTextWidth(
  text: string,
  font: string = "14px ui-sans-serif, system-ui, sans-serif"
): number {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) return 0
  context.font = font
  return context.measureText(text).width
}

// Get the text content from a cell value
function getCellText(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number") return value.toString()
  if (typeof value === "boolean") return value ? "Ano" : "Ne"
  if (value instanceof Date) return value.toLocaleDateString("cs-CZ")
  if (typeof value === "object") {
    // Handle common object patterns
    const obj = value as Record<string, unknown>
    if ("party_name" in obj) return String(obj.party_name)
    if ("name" in obj) return String(obj.name)
    if ("code" in obj) return String(obj.code)
    if ("label" in obj) return String(obj.label)
    return JSON.stringify(value)
  }
  return String(value)
}

export function ColumnResizeHandle<TData>({ header, table }: ColumnResizeHandleProps<TData>) {
  const handleDoubleClick = React.useCallback(() => {
    const columnId = header.column.id
    const column = header.column

    // Get the header text from meta.title or columnId
    const headerTitle = column.columnDef.meta?.title
    const headerText = typeof headerTitle === "string" ? headerTitle : columnId

    // Measure header text width (bold font for headers)
    const textWidth = measureTextWidth(headerText, "600 14px ui-sans-serif, system-ui, sans-serif")

    // Add width for sort icon if column can sort (icon 16px + gap 8px)
    const sortIconWidth = column.getCanSort() ? 24 : 0

    // Add width for type icon if exists (icon 14px + gap 6px)
    const typeIconWidth = column.columnDef.meta?.columnType ? 20 : 0

    // Padding: 8px left + 8px right
    const padding = 16

    // Total header width
    let maxWidth = textWidth + sortIconWidth + typeIconWidth + padding

    // Get all visible rows and measure cell content
    const rows = table.getRowModel().rows

    for (const row of rows) {
      // Use the cell's getValue method which handles all accessor types
      const cell = row.getAllCells().find((c) => c.column.id === columnId)
      if (!cell) continue

      const cellValue = cell.getValue()
      const cellText = getCellText(cellValue)
      const cellWidth = measureTextWidth(cellText) + 32 // padding
      maxWidth = Math.max(maxWidth, cellWidth)
    }

    // Add minimum/maximum constraints
    const minWidth = 60
    const maxAllowed = 500
    const finalWidth = Math.max(minWidth, Math.min(maxAllowed, Math.ceil(maxWidth)))

    // Update column sizing
    table.setColumnSizing((old) => ({
      ...old,
      [columnId]: finalWidth,
    }))
  }, [header, table])

  if (!header.column.getCanResize()) {
    return null
  }

  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "absolute top-0 -right-1 z-10 h-full w-2 cursor-col-resize touch-none select-none",
        "opacity-0 transition-opacity group-hover:opacity-100",
        "bg-border hover:bg-primary",
        header.column.getIsResizing() && "bg-primary opacity-100"
      )}
    />
  )
}
