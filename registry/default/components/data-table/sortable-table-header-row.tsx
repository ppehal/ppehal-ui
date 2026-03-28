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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { HeaderGroup, Table } from "@tanstack/react-table"

import { TableRow, TableHead } from "@/registry/default/ui/table"
import { DraggableTableHeader } from "./draggable-table-header"
import "@/registry/default/lib/table-types" // Extend ColumnMeta type

// Fixed column IDs that cannot be reordered
const FIXED_COLUMNS = ["select", "actions"]

interface SortableTableHeaderRowProps<TData> {
  headerGroup: HeaderGroup<TData>
  table: Table<TData>
  onColumnOrderChange: (newOrder: string[]) => void
}

// Custom accessibility announcements container to avoid invalid DOM nesting
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Announcements({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(children, document.body)
}

export function SortableTableHeaderRow<TData>({
  headerGroup,
  table,
  onColumnOrderChange,
}: SortableTableHeaderRowProps<TData>) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  // Stable ID for DndContext to prevent hydration mismatch
  const dndContextId = React.useId()

  // Get current column order (or default from column definitions)
  const columnOrder =
    table.getState().columnOrder.length > 0
      ? table.getState().columnOrder
      : table.getAllLeafColumns().map((col) => col.id)

  // All column IDs for sortable context (including fixed for proper positioning)
  const allColumnIds = headerGroup.headers.map((h) => h.id)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
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

    // Get columns to check pinned state
    const activeColumn = table.getColumn(active.id as string)
    const overColumn = table.getColumn(over.id as string)

    if (!activeColumn || !overColumn) return

    // Prevent dragging between pinned groups
    const activePinned = activeColumn.getIsPinned()
    const overPinned = overColumn.getIsPinned()

    if (activePinned !== overPinned) {
      // Don't allow dragging between pinned and unpinned sections
      return
    }

    const oldIndex = columnOrder.indexOf(active.id as string)
    const newIndex = columnOrder.indexOf(over.id as string)
    const newOrder = arrayMove(columnOrder, oldIndex, newIndex)
    onColumnOrderChange(newOrder)
  }

  // Find the active header for overlay
  const activeHeader = activeId ? headerGroup.headers.find((h) => h.id === activeId) : null

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToHorizontalAxis]}
      accessibility={{
        // Use custom container to avoid invalid DOM nesting in thead
        container: typeof document !== "undefined" ? document.body : undefined,
      }}
    >
      <SortableContext items={allColumnIds} strategy={horizontalListSortingStrategy}>
        <TableRow>
          {headerGroup.headers.map((header) => (
            <DraggableTableHeader
              key={header.id}
              header={header}
              table={table}
              isFixed={FIXED_COLUMNS.includes(header.id)}
            />
          ))}
        </TableRow>
      </SortableContext>

      {/* Drag overlay rendered via portal to avoid invalid DOM nesting */}
      {typeof document !== "undefined" &&
        createPortal(
          <DragOverlay>
            {activeHeader ? (
              <TableHead
                className="bg-background rounded border shadow-lg"
                style={{ width: activeHeader.getSize() }}
              >
                <span className="px-2 text-sm font-medium">
                  {activeHeader.column.columnDef.meta?.title || activeHeader.id}
                </span>
              </TableHead>
            ) : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  )
}
