"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Header, Table, flexRender } from "@tanstack/react-table"

import { TableHead } from "@/registry/default/ui/table"
import { ColumnResizeHandle } from "./column-resize-handle"
import { getPinnedColumnStyles, getPinnedColumnClasses } from "./column-pinning-utils"
import { cn } from "@/lib/utils"

interface DraggableTableHeaderProps<TData> {
  header: Header<TData, unknown>
  table: Table<TData>
  isFixed?: boolean
}

export function DraggableTableHeader<TData>({
  header,
  table,
  isFixed = false,
}: DraggableTableHeaderProps<TData>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.id,
    disabled: isFixed,
  })

  const isPinned = header.column.getIsPinned()
  const pinnedStyles = getPinnedColumnStyles(header.column, table)
  const pinnedClasses = getPinnedColumnClasses(header.column, table)

  const style: React.CSSProperties = {
    ...pinnedStyles,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : isPinned ? 2 : 0,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      colSpan={header.colSpan}
      className={cn(
        "group relative",
        isDragging && "bg-muted shadow-lg",
        // DND cursor - only for non-fixed columns
        !isFixed && "cursor-grab active:cursor-grabbing",
        pinnedClasses
      )}
      {...attributes}
      {...(!isFixed ? listeners : {})}
      aria-label={!isFixed ? "Přetáhnout sloupec" : undefined}
    >
      {/* Header content - full width */}
      <div className="min-w-0 flex-1">
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
      </div>

      <ColumnResizeHandle header={header} table={table} />
    </TableHead>
  )
}
