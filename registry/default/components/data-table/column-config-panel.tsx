"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Table } from "@tanstack/react-table"
import { SlidersHorizontal, Eye, EyeOff, RotateCcw, Search, Type } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/default/ui/popover"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Switch } from "@/registry/default/ui/switch"
import { SortableColumnItem } from "./sortable-column-item"
import { useDbFieldNamesContext } from "./db-field-names-context"
import {
  getColumnTitle,
  getHideableColumns,
  showAllColumns,
  hideAllColumns,
  resetColumnVisibility,
} from "./column-visibility-utils"
import { COLUMN_TYPE_CONFIG } from "@/registry/default/lib/constants/column-types"
import "@/registry/default/lib/table-types"

// Fixed column IDs that cannot be reordered
const FIXED_COLUMNS = ["select", "actions"]

interface ColumnConfigPanelProps<TData> {
  table: Table<TData>
  columnOrder: string[]
  onColumnOrderChange: (newOrder: string[]) => void
  onResetAll?: () => void
  /** Whether to show admin features like DB field names toggle (default: false) */
  showAdminFeatures?: boolean
}

export function ColumnConfigPanel<TData>({
  table,
  columnOrder: columnOrderProp,
  onColumnOrderChange,
  onResetAll,
  showAdminFeatures = false,
}: ColumnConfigPanelProps<TData>) {
  const { showDbFieldNames, setShowDbFieldNames } = useDbFieldNamesContext()
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // Get hideable columns
  const hideableColumns = React.useMemo(() => getHideableColumns(table), [table])

  // Get current column order (from prop or default from column definitions)
  const columnOrder =
    columnOrderProp.length > 0 ? columnOrderProp : table.getAllLeafColumns().map((col) => col.id)

  // Filter columns by search query
  const filteredColumns = React.useMemo(() => {
    if (!searchQuery.trim()) return hideableColumns

    const query = searchQuery.toLowerCase()
    return hideableColumns.filter((column) => {
      const title = getColumnTitle(column).toLowerCase()
      return title.includes(query)
    })
  }, [hideableColumns, searchQuery])

  // Sort columns by their order in columnOrder
  const sortedColumns = React.useMemo(() => {
    return [...filteredColumns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.id)
      const bIndex = columnOrder.indexOf(b.id)
      return aIndex - bIndex
    })
  }, [filteredColumns, columnOrder])

  // Column IDs for sortable context
  const columnIds = sortedColumns.map((col) => col.id)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const oldIndex = columnOrder.indexOf(active.id as string)
    const newIndex = columnOrder.indexOf(over.id as string)
    const newOrder = arrayMove(columnOrder, oldIndex, newIndex)

    // Update table state AND persist to localStorage
    table.setColumnOrder(newOrder)
    onColumnOrderChange(newOrder)
  }

  // Find the active column for overlay
  const activeColumn = activeId ? table.getColumn(activeId) : null
  const activeColumnType = activeColumn?.columnDef.meta?.columnType
  const activeTypeConfig = activeColumnType ? COLUMN_TYPE_CONFIG[activeColumnType] : null
  const ActiveTypeIcon = activeTypeConfig?.icon || Type

  // Handler for reset button - resets visibility, order, and pinning
  const handleReset = React.useCallback(() => {
    if (onResetAll) {
      // Full reset via preferences hook - updates controlled state which flows to table
      // No need to call table.reset*() methods - controlled state handles it
      onResetAll()
    } else {
      // Fallback - only visibility (for backward compatibility)
      resetColumnVisibility(table)
    }
  }, [onResetAll, table])

  // Count visible columns
  const visibleCount = hideableColumns.filter((col) => col.getIsVisible()).length
  const totalCount = hideableColumns.length

  // Calculate dynamic height based on column count
  // Each item is ~40px, padding 8px
  const itemHeight = 40
  const padding = 8
  const contentHeight = sortedColumns.length * itemHeight + padding

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Sloupce
          <span className="bg-muted ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-normal">
            {visibleCount}/{totalCount}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[320px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h4 className="text-sm font-medium">Konfigurace sloupců</h4>
        </div>

        {/* DB Field Names toggle - ADMIN only */}
        {showAdminFeatures && (
          <div className="flex items-center justify-between border-b px-3 py-2">
            <Label
              htmlFor="show-db-fields"
              className="text-muted-foreground cursor-pointer text-sm"
            >
              Zobrazit DB pole
            </Label>
            <Switch
              id="show-db-fields"
              checked={showDbFieldNames}
              onCheckedChange={setShowDbFieldNames}
            />
          </div>
        )}

        {/* Search */}
        <div className="border-b p-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Hledat sloupce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8"
            />
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex gap-1 border-b px-2 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() => showAllColumns(table)}
          >
            <Eye className="mr-1 h-3 w-3" />
            Vše
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() => hideAllColumns(table)}
          >
            <EyeOff className="mr-1 h-3 w-3" />
            Nic
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleReset}
            title="Reset"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        {/* Draggable column list */}
        <ScrollArea style={{ maxHeight: `min(${contentHeight}px, 60vh)` }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={columnIds} strategy={verticalListSortingStrategy}>
              <div className="p-1">
                {sortedColumns.length > 0 ? (
                  sortedColumns.map((column) => (
                    <SortableColumnItem
                      key={column.id}
                      column={column}
                      isFixed={FIXED_COLUMNS.includes(column.id)}
                    />
                  ))
                ) : (
                  <div className="text-muted-foreground py-6 text-center text-sm">
                    Žádné sloupce nenalezeny
                  </div>
                )}
              </div>
            </SortableContext>

            {/* Drag overlay */}
            {typeof document !== "undefined" &&
              createPortal(
                <DragOverlay>
                  {activeColumn ? (
                    <div className="bg-background flex items-center gap-2 rounded-md border px-3 py-2 shadow-lg">
                      <ActiveTypeIcon className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">{getColumnTitle(activeColumn)}</span>
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body
              )}
          </DndContext>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
