"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { flexRender, type Row, type Table } from "@tanstack/react-table"

import { TableRow, TableCell } from "@/registry/default/ui/table"
import { CellErrorBoundary } from "./cell-error-boundary"
import { getPinnedColumnStyles, getPinnedColumnClasses } from "./column-pinning-utils"
import { cn } from "@/lib/utils"

interface SortableRowProps<TData> {
  row: Row<TData>
  table: Table<TData>
  isSaving: boolean
  onRowClick?: (row: TData) => void
  activeRowId?: string | number
}

export function SortableRow<TData>({
  row,
  table,
  isSaving,
  onRowClick,
  activeRowId,
}: SortableRowProps<TData>) {
  const rowId = (row.original as { id: string }).id

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowId,
    disabled: isSaving,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isActive =
    activeRowId != null && (row.original as { id?: string | number }).id === activeRowId

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
      data-active={isActive || undefined}
      onClick={() => onRowClick?.(row.original)}
      className={cn(onRowClick && "cursor-pointer")}
    >
      {/* Drag handle */}
      <TableCell className="w-10 px-2">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab touch-none rounded p-0.5 active:cursor-grabbing"
          tabIndex={0}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      {/* Data cells */}
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          style={getPinnedColumnStyles(cell.column, table)}
          className={cn(getPinnedColumnClasses(cell.column, table))}
        >
          <CellErrorBoundary columnId={cell.column.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </CellErrorBoundary>
        </TableCell>
      ))}
    </TableRow>
  )
}
