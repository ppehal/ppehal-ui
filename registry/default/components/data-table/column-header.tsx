"use client"

import * as React from "react"
import { Column } from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  EyeOff,
  Filter,
  FilterX,
  Pin,
  PinOff,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { canPinColumn } from "./column-pinning-utils"
import { ColumnFilterPopover } from "./column-filter-popover"
import { Badge } from "@/registry/default/ui/badge"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/default/ui/tooltip"
import { COLUMN_TYPE_CONFIG } from "@/registry/default/lib/constants/column-types"
import { useShowDbFieldNames } from "./db-field-names-context"
import "@/registry/default/lib/table-types"

/**
 * Resolve DB field name for a column (admin display)
 * Priority: meta.dbFieldName > meta.fkIdField > column.id
 */
function getDbFieldName<TData, TValue>(column: Column<TData, TValue>): string {
  const meta = column.columnDef.meta
  // Explicit override
  if (meta?.dbFieldName) return meta.dbFieldName
  // For FK columns, fkIdField is the actual DB field
  if (meta?.fkIdField) return meta.fkIdField
  // Default: column ID (usually same as accessorKey)
  return column.id
}

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  showTypeIcon?: boolean
}

// Threshold to distinguish click from drag (same as DND activationConstraint)
const DRAG_THRESHOLD = 8

// Menu item component with dropdown-like styling
function MenuItem({
  children,
  onClick,
  onClose,
}: {
  children: React.ReactNode
  onClick: () => void
  onClose: () => void
}) {
  return (
    <button
      onClick={() => {
        onClick()
        onClose()
      }}
      className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none"
    >
      {children}
    </button>
  )
}

// Separator component
function MenuSeparator() {
  return <div className="bg-border -mx-1 my-1 h-px" />
}

// Filter menu item with nested popover
function FilterMenuItem<TData, TValue>({
  column,
  onMainMenuClose,
}: {
  column: Column<TData, TValue>
  onMainMenuClose: () => void
}) {
  const [filterOpen, setFilterOpen] = React.useState(false)
  const isFiltered = column.getIsFiltered()
  const columnType = column.columnDef.meta?.columnType
  const filterOptions = column.columnDef.meta?.filterOptions

  const handleFilterClose = () => {
    setFilterOpen(false)
    onMainMenuClose()
  }

  return (
    <Popover open={filterOpen} onOpenChange={setFilterOpen}>
      <PopoverTrigger asChild>
        <button className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none">
          <Filter className="text-muted-foreground/70 h-3.5 w-3.5" />
          Filtrovat
          {isFiltered && (
            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
              1
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ColumnFilterPopover
          column={column}
          columnType={columnType}
          filterOptions={filterOptions}
          onClose={handleFilterClose}
        />
      </PopoverContent>
    </Popover>
  )
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  showTypeIcon = true,
}: DataTableColumnHeaderProps<TData, TValue>) {
  // Controlled popover state
  const [isOpen, setIsOpen] = React.useState(false)
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null)

  // Track pointer start position - NO preventDefault, let DND work!
  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return // Only left click
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  // Open menu only on release if it wasn't a drag
  const handlePointerUp = React.useCallback((e: React.PointerEvent) => {
    if (!pointerStartRef.current) return

    const dx = e.clientX - pointerStartRef.current.x
    const dy = e.clientY - pointerStartRef.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Only open if click (not drag)
    if (distance < DRAG_THRESHOLD) {
      setIsOpen(true)
    }

    pointerStartRef.current = null
  }, [])

  // Handle keyboard for accessibility
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setIsOpen(true)
    }
  }, [])

  // Close handler
  const closeMenu = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  // Get type icon configuration
  const columnType = column.columnDef.meta?.columnType
  const typeConfig = columnType ? COLUMN_TYPE_CONFIG[columnType] : null
  const TypeIcon = typeConfig?.icon

  // Get showDbFieldNames from context (admin feature)
  const showDbFieldNames = useShowDbFieldNames()
  const dbFieldName = showDbFieldNames ? getDbFieldName(column) : null

  // Render type icon with tooltip
  const renderTypeIcon = () => {
    if (!showTypeIcon || !TypeIcon) return null

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <TypeIcon
            className="text-muted-foreground/70 mr-1.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {typeConfig.description}
        </TooltipContent>
      </Tooltip>
    )
  }

  // Render sort indicator icon
  const renderSortIcon = () => {
    if (!column.getCanSort()) return null

    if (column.getIsSorted() === "desc") {
      return <ArrowDown className="text-muted-foreground h-4 w-4 shrink-0" />
    }
    if (column.getIsSorted() === "asc") {
      return <ArrowUp className="text-muted-foreground h-4 w-4 shrink-0" />
    }
    return <ChevronsUpDown className="text-muted-foreground/50 h-4 w-4 shrink-0" />
  }

  // Render filter indicator
  const renderFilterIndicator = () => {
    if (!column.getIsFiltered()) return null
    return <Filter className="text-primary h-3.5 w-3.5 shrink-0" />
  }

  // Check if column can be filtered
  const canFilter = column.getCanFilter() && column.columnDef.meta?.enableColumnFilter !== false

  // Non-sortable columns - no menu
  if (!column.getCanSort()) {
    return (
      <div className={cn("flex h-full w-full items-center justify-between px-2 py-2", className)}>
        <div className="flex min-w-0 items-center">
          {renderTypeIcon()}
          <div className="flex min-w-0 flex-col">
            <span className="truncate">{title}</span>
            {dbFieldName && (
              <span className="text-muted-foreground truncate font-mono text-[10px] leading-tight">
                {dbFieldName}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "flex h-full w-full cursor-pointer items-center justify-between px-2 py-2 select-none",
            "hover:bg-accent/50",
            isOpen && "bg-accent",
            className
          )}
          role="button"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          <div className="flex min-w-0 items-center">
            {renderTypeIcon()}
            <div className="flex min-w-0 flex-col">
              <span className="truncate">{title}</span>
              {dbFieldName && (
                <span className="text-muted-foreground truncate font-mono text-[10px] leading-tight">
                  {dbFieldName}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {renderFilterIndicator()}
            {renderSortIcon()}
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-48 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <MenuItem onClick={() => column.toggleSorting(false)} onClose={closeMenu}>
          <ArrowUp className="text-muted-foreground/70 h-3.5 w-3.5" />
          Vzestupně
        </MenuItem>
        <MenuItem onClick={() => column.toggleSorting(true)} onClose={closeMenu}>
          <ArrowDown className="text-muted-foreground/70 h-3.5 w-3.5" />
          Sestupně
        </MenuItem>
        {canFilter && (
          <>
            <MenuSeparator />
            <FilterMenuItem column={column} onMainMenuClose={closeMenu} />
            {column.getIsFiltered() && (
              <MenuItem onClick={() => column.setFilterValue(undefined)} onClose={closeMenu}>
                <FilterX className="text-muted-foreground/70 h-3.5 w-3.5" />
                Zrušit filtr
              </MenuItem>
            )}
          </>
        )}
        {canPinColumn(column.id) && (
          <>
            <MenuSeparator />
            {column.getIsPinned() === "left" ? (
              <MenuItem onClick={() => column.pin(false)} onClose={closeMenu}>
                <PinOff className="text-muted-foreground/70 h-3.5 w-3.5" />
                Odepnout sloupec
              </MenuItem>
            ) : (
              <MenuItem onClick={() => column.pin("left")} onClose={closeMenu}>
                <Pin className="text-muted-foreground/70 h-3.5 w-3.5" />
                Připnout vlevo
              </MenuItem>
            )}
          </>
        )}
        {column.getCanHide() && (
          <>
            <MenuSeparator />
            <MenuItem onClick={() => column.toggleVisibility(false)} onClose={closeMenu}>
              <EyeOff className="text-muted-foreground/70 h-3.5 w-3.5" />
              Skrýt sloupec
            </MenuItem>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
