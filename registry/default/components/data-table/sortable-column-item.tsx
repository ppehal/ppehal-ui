"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Column } from "@tanstack/react-table"
import { GripVertical, Eye, EyeOff, Type } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { cn } from "@/lib/utils"
import { COLUMN_TYPE_CONFIG } from "@/registry/default/lib/constants/column-types"
import { getColumnTitle } from "./column-visibility-utils"
import "@/registry/default/lib/table-types"

interface SortableColumnItemProps<TData> {
  column: Column<TData, unknown>
  isFixed?: boolean
}

export function SortableColumnItem<TData>({
  column,
  isFixed = false,
}: SortableColumnItemProps<TData>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: isFixed,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isVisible = column.getIsVisible()
  const columnType = column.columnDef.meta?.columnType
  const typeConfig = columnType ? COLUMN_TYPE_CONFIG[columnType] : null
  const TypeIcon = typeConfig?.icon || Type

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5",
        "hover:bg-muted/50",
        isDragging && "bg-muted shadow-md",
        !isVisible && "opacity-60"
      )}
      {...attributes}
    >
      {/* Drag handle */}
      <div
        className={cn(
          "flex-shrink-0",
          isFixed ? "cursor-not-allowed opacity-30" : "cursor-grab active:cursor-grabbing"
        )}
        {...(!isFixed ? listeners : {})}
      >
        <GripVertical className="text-muted-foreground h-4 w-4" />
      </div>

      {/* Type icon */}
      <TypeIcon className="text-muted-foreground h-4 w-4 flex-shrink-0" />

      {/* Column name */}
      <span className="flex-1 truncate text-sm">{getColumnTitle(column)}</span>

      {/* Visibility toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 flex-shrink-0 p-0"
        onClick={(e) => {
          e.stopPropagation()
          column.toggleVisibility(!isVisible)
        }}
        aria-label={isVisible ? "Skrýt sloupec" : "Zobrazit sloupec"}
      >
        {isVisible ? (
          <Eye className="text-muted-foreground h-4 w-4" />
        ) : (
          <EyeOff className="text-muted-foreground h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
