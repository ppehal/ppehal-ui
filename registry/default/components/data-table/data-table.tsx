"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  Row,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/default/ui/table"
import { DataTablePagination } from "./pagination"
import { SortableTableHeaderRow } from "./sortable-table-header-row"
import { SortableRow } from "./sortable-row"
import { FloatingBar, type FloatingBarAction } from "./floating-bar"
import { FloatingScrollbar } from "./floating-scrollbar"
import { useTablePreferences } from "@/registry/default/hooks/use-table-preferences"
import { useFloatingScrollbar } from "@/registry/default/hooks/use-floating-scrollbar"
import {
  getPinnedColumnStyles,
  getPinnedColumnClasses,
  enforceFixedPinning,
} from "./column-pinning-utils"
import { filterFns } from "@/registry/default/lib/table-filters"
import { cn } from "@/lib/utils"
import { CellErrorBoundary } from "./cell-error-boundary"
import { DbFieldNamesProvider } from "./db-field-names-context"

import type { RowDensity } from "@/registry/default/hooks/use-table-preferences"
import type {
  VisibilityState,
  SortingState,
  ColumnOrderState,
  ColumnPinningState,
} from "@tanstack/react-table"

/** Controls passed to toolbar render prop when reorderAction is provided */
export interface ReorderControls {
  isReorderMode: boolean
  setReorderMode: (v: boolean) => void
}

/** Configuration for expandable rows */
interface ExpandableConfig<TData> {
  /** Function to determine if row can be expanded (default: all rows can expand) */
  canExpand?: (row: Row<TData>) => boolean
  /** Render function for expanded row content */
  renderExpanded: (row: Row<TData>) => React.ReactNode
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  tableId: string
  /** Optional view identifier for per-view preferences (e.g., "debtors"). Creates separate localStorage. */
  viewId?: string
  /** Default column visibility for this view (used when no user customization exists) */
  defaultColumnVisibility?: VisibilityState
  /** Default sorting for this view */
  defaultSorting?: SortingState
  /** Default column order for this view */
  defaultColumnOrder?: ColumnOrderState
  /** Default column pinning for this view (used when no user customization exists) */
  defaultColumnPinning?: ColumnPinningState
  onRowClick?: (row: TData) => void
  toolbar?: (
    table: ReturnType<typeof useReactTable<TData>>,
    density: RowDensity,
    setDensity: (d: RowDensity) => void,
    resetAll: () => void,
    reorderControls?: ReorderControls
  ) => React.ReactNode
  isLoading?: boolean
  floatingBarActions?: FloatingBarAction<TData>[]
  activeRowId?: string | number
  /** Table meta for callbacks (onOpenDetail, updateData, etc.) */
  meta?: Record<string, unknown>
  /** Optional expandable rows configuration */
  expandable?: ExpandableConfig<TData>
  /** Server action to persist row reorder. Enables row DnD when provided. */
  reorderAction?: (items: Array<{ id: string; order: number }>) => Promise<void>
  /** Field name to group rows by for DnD (e.g. "tripSlug"). DnD only within same group. */
  groupBy?: string
  /** Labels for groupBy values (optional, falls back to raw value) */
  groupLabels?: Record<string, string>
}

/** Conditional DndContext wrapper for row reordering */
function RowDndWrapper({
  enabled,
  id,
  sensors,
  onDragEnd,
  children,
}: {
  enabled: boolean
  id: string
  sensors: ReturnType<typeof useSensors>
  onDragEnd: (event: DragEndEvent) => void
  children: React.ReactNode
}) {
  if (!enabled) return <>{children}</>
  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToVerticalAxis]}
      accessibility={{
        container: typeof document !== "undefined" ? document.body : undefined,
      }}
    >
      {children}
    </DndContext>
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  tableId,
  viewId,
  defaultColumnVisibility,
  defaultSorting,
  defaultColumnOrder,
  defaultColumnPinning,
  onRowClick,
  toolbar,
  isLoading,
  floatingBarActions,
  activeRowId,
  meta,
  expandable,
  reorderAction,
  groupBy,
  groupLabels,
}: DataTableProps<TData, TValue>) {
  // Construct effective table ID for per-view storage
  const effectiveTableId = viewId ? `${tableId}_${viewId}` : tableId

  const hasReorder = !!reorderAction

  const {
    preferences,
    setColumnVisibility,
    setSorting,
    setPageSize,
    setColumnSizing,
    setColumnOrder,
    setColumnPinning,
    setRowDensity,
    setShowDbFieldNames,
    setReorderMode,
    resetAll,
  } = useTablePreferences(effectiveTableId, {
    defaultColumnVisibility,
    defaultSorting,
    defaultColumnOrder,
    defaultColumnPinning,
  })

  const {
    tableWrapperRef,
    scrollBarRef,
    sentinelRef,
    showFloatingBar,
    tableWidth,
    containerRect,
    handleBarScroll,
  } = useFloatingScrollbar()

  // Enforce fixed columns (select left, actions right)
  const enforcedColumnPinning = React.useMemo(
    () => enforceFixedPinning(preferences.columnPinning),
    [preferences.columnPinning]
  )

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pageIndex, setPageIndex] = React.useState(0)
  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  // ─── Row DnD state ────────────────────────────────────────────────
  const isReorderMode = hasReorder && preferences.reorderMode
  const [localData, setLocalData] = React.useState(data)
  const prevDataRef = React.useRef(data)
  if (prevDataRef.current !== data) {
    prevDataRef.current = data
    setLocalData(data)
  }
  const isSavingRef = React.useRef(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const rowDndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const rowDndContextId = React.useId()

  const handleRowDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id || !reorderAction) return
      if (isSavingRef.current) return

      const oldIndex = localData.findIndex((d) => (d as { id: string }).id === String(active.id))
      const newIndex = localData.findIndex((d) => (d as { id: string }).id === String(over.id))
      if (oldIndex === -1 || newIndex === -1) return

      // If grouped, only allow reorder within same group
      if (groupBy) {
        const activeGroup = (localData[oldIndex] as Record<string, unknown>)[groupBy]
        const overGroup = (localData[newIndex] as Record<string, unknown>)[groupBy]
        if (activeGroup !== overGroup) return
      }

      const newData = arrayMove(localData, oldIndex, newIndex)
      setLocalData(newData)

      // Compute order values — if grouped, only send items from the affected group
      let itemsToUpdate: Array<{ id: string; order: number }>
      if (groupBy) {
        const groupValue = (newData[newIndex] as Record<string, unknown>)[groupBy]
        const groupItems = newData.filter(
          (d) => (d as Record<string, unknown>)[groupBy] === groupValue
        )
        itemsToUpdate = groupItems.map((item, idx) => ({
          id: (item as { id: string }).id,
          order: idx,
        }))
      } else {
        itemsToUpdate = newData.map((item, idx) => ({
          id: (item as { id: string }).id,
          order: idx,
        }))
      }

      isSavingRef.current = true
      setIsSaving(true)

      reorderAction(itemsToUpdate)
        .catch(() => {
          setLocalData(data)
        })
        .finally(() => {
          isSavingRef.current = false
          setIsSaving(false)
        })
    },
    [localData, data, reorderAction, groupBy]
  )

  // Grouped rows computation for DnD
  const groupedLocalData = React.useMemo(() => {
    if (!groupBy || !isReorderMode) return null
    const groups: Array<{ key: string; label: string; items: TData[] }> = []
    let currentKey: string | null = null

    for (const item of localData) {
      const key = String((item as Record<string, unknown>)[groupBy] ?? "")
      if (key !== currentKey) {
        groups.push({ key, label: groupLabels?.[key] ?? key, items: [item] })
        currentKey = key
      } else {
        groups[groups.length - 1].items.push(item)
      }
    }
    return groups
  }, [localData, groupBy, groupLabels, isReorderMode])

  // Reorder controls for toolbar
  const reorderControls = React.useMemo<ReorderControls | undefined>(
    () => (hasReorder ? { isReorderMode: !!isReorderMode, setReorderMode } : undefined),
    [hasReorder, isReorderMode, setReorderMode]
  )

  // Reset to first page when data changes
  React.useEffect(() => {
    setPageIndex(0)
  }, [data])

  // Reset expanded state when data, sorting, or filters change
  React.useEffect(() => {
    setExpanded({})
  }, [data, preferences.sorting, columnFilters])

  // Collapse expanded rows when entering reorder mode
  React.useEffect(() => {
    if (isReorderMode) setExpanded({})
  }, [isReorderMode])

  const tableData = isReorderMode ? localData : data

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting: isReorderMode ? [] : preferences.sorting,
      columnVisibility: preferences.columnVisibility,
      columnSizing: preferences.columnSizing,
      columnOrder: preferences.columnOrder,
      columnPinning: enforcedColumnPinning,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: isReorderMode ? 0 : pageIndex,
        pageSize: isReorderMode ? 9999 : preferences.pageSize,
      },
      // Only include expanded state if expandable is enabled
      ...(expandable && { expanded }),
    },
    filterFns,
    defaultColumn: {
      // Use "smart" instead of "auto" - TanStack has special handling for "auto" that bypasses filterFns
      filterFn: "smart" as never,
    },
    enableSorting: !isReorderMode,
    enableRowSelection: !isReorderMode,
    enableColumnResizing: true,
    enableColumnFilters: true,
    columnResizeMode: "onChange",
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === "function" ? updater(preferences.sorting) : updater
      setSorting(newSorting)
    },
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === "function" ? updater(columnFilters) : updater
      setColumnFilters(newFilters)
    },
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === "function" ? updater(preferences.columnVisibility) : updater
      setColumnVisibility(newVisibility)
    },
    onColumnSizingChange: (updater) => {
      const newSizing = typeof updater === "function" ? updater(preferences.columnSizing) : updater
      setColumnSizing(newSizing)
    },
    onColumnOrderChange: (updater) => {
      const newOrder = typeof updater === "function" ? updater(preferences.columnOrder) : updater
      setColumnOrder(newOrder)
    },
    onColumnPinningChange: (updater) => {
      const newPinning = typeof updater === "function" ? updater(enforcedColumnPinning) : updater
      setColumnPinning(newPinning)
    },
    onPaginationChange: (updater) => {
      const currentPagination = { pageIndex, pageSize: preferences.pageSize }
      const newPagination = typeof updater === "function" ? updater(currentPagination) : updater
      setPageIndex(newPagination.pageIndex)
      // Only persist pageSize if it changed
      if (newPagination.pageSize !== preferences.pageSize) {
        setPageSize(newPagination.pageSize)
      }
    },
    // Expandable row support
    ...(expandable && {
      onExpandedChange: setExpanded,
      getExpandedRowModel: getExpandedRowModel(),
      getRowCanExpand: expandable.canExpand ?? (() => true),
    }),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      ...meta,
      showDbFieldNames: preferences.showDbFieldNames,
    },
  })

  return (
    <DbFieldNamesProvider
      showDbFieldNames={preferences.showDbFieldNames}
      setShowDbFieldNames={setShowDbFieldNames}
    >
      <div className="space-y-4">
        {toolbar &&
          toolbar(table, preferences.rowDensity, setRowDensity, resetAll, reorderControls)}
        <div ref={tableWrapperRef} className="relative">
          <div className="rounded-md border">
            <RowDndWrapper
              enabled={isReorderMode && table.getRowModel().rows.length > 1}
              id={rowDndContextId}
              sensors={rowDndSensors}
              onDragEnd={handleRowDragEnd}
            >
              <Table
                data-density={preferences.rowDensity}
                style={{
                  width: table.getCenterTotalSize(),
                  tableLayout: "fixed",
                }}
              >
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) =>
                    isReorderMode ? (
                      // Simplified header row in reorder mode (no column DnD)
                      <TableRow key={headerGroup.id}>
                        <TableHead className="w-10" />
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} style={{ width: header.getSize() }}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ) : (
                      <SortableTableHeaderRow
                        key={headerGroup.id}
                        headerGroup={headerGroup}
                        table={table}
                        onColumnOrderChange={setColumnOrder}
                      />
                    )
                  )}
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        {isReorderMode && <TableCell className="w-10" />}
                        {table.getAllLeafColumns().map((column) => (
                          <TableCell
                            key={`skeleton-cell-${column.id}`}
                            style={getPinnedColumnStyles(column, table)}
                            className={cn(getPinnedColumnClasses(column, table))}
                          >
                            <div className="bg-muted h-4 w-full animate-pulse rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : table.getRowModel().rows?.length ? (
                    isReorderMode ? (
                      // ─── Reorder mode with row DnD ────────────────────
                      groupedLocalData ? (
                        // Grouped DnD — SortableContext per group
                        groupedLocalData.map((group) => {
                          const groupRowIds = table
                            .getRowModel()
                            .rows.filter(
                              (r) =>
                                String((r.original as Record<string, unknown>)[groupBy!]) ===
                                group.key
                            )
                            .map((r) => (r.original as { id: string }).id)
                          const groupRows = table
                            .getRowModel()
                            .rows.filter(
                              (r) =>
                                String((r.original as Record<string, unknown>)[groupBy!]) ===
                                group.key
                            )
                          return (
                            <SortableContext
                              key={group.key}
                              items={groupRowIds}
                              strategy={verticalListSortingStrategy}
                            >
                              {/* Group header */}
                              <TableRow className="bg-muted/50">
                                <TableCell
                                  colSpan={
                                    table.getAllLeafColumns().length + 1 /* +1 for drag handle */
                                  }
                                  className="text-muted-foreground px-4 py-2 text-xs font-semibold tracking-wide uppercase"
                                >
                                  {group.label}
                                </TableCell>
                              </TableRow>
                              {groupRows.map((row) => (
                                <SortableRow
                                  key={(row.original as { id: string }).id}
                                  row={row}
                                  table={table}
                                  isSaving={isSaving}
                                  onRowClick={onRowClick}
                                  activeRowId={activeRowId}
                                />
                              ))}
                            </SortableContext>
                          )
                        })
                      ) : (
                        // Single DnD context (no grouping)
                        <SortableContext
                          items={table
                            .getRowModel()
                            .rows.map((r) => (r.original as { id: string }).id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {table.getRowModel().rows.map((row) => (
                            <SortableRow
                              key={(row.original as { id: string }).id}
                              row={row}
                              table={table}
                              isSaving={isSaving}
                              onRowClick={onRowClick}
                              activeRowId={activeRowId}
                            />
                          ))}
                        </SortableContext>
                      )
                    ) : (
                      // ─── Browse mode (default) ────────────────────────
                      table.getRowModel().rows.map((row) => {
                        const isActive =
                          activeRowId != null &&
                          (row.original as { id?: string | number }).id === activeRowId
                        const isExpanded = expandable && row.getIsExpanded()
                        return (
                          <React.Fragment key={row.id}>
                            <TableRow
                              data-state={row.getIsSelected() && "selected"}
                              data-active={isActive || undefined}
                              onClick={() => onRowClick?.(row.original)}
                              className={cn(
                                onRowClick && "cursor-pointer",
                                isExpanded && "bg-muted/50"
                              )}
                            >
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
                            {/* Expanded row content - no pinning styles, spans all columns */}
                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                                  {expandable.renderExpanded(row)}
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + (isReorderMode ? 1 : 0)}
                        className="h-24 text-center"
                      >
                        Žádné výsledky.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </RowDndWrapper>
            {/* Sentinel for IntersectionObserver - detects when table bottom is visible */}
            <div ref={sentinelRef} className="h-px" />
          </div>
          <FloatingScrollbar
            show={showFloatingBar}
            tableWidth={tableWidth}
            containerRect={containerRect}
            scrollBarRef={scrollBarRef}
            onScroll={handleBarScroll}
          />
        </div>
        {!isReorderMode && <DataTablePagination table={table} />}

        {/* Floating bulk actions bar */}
        {floatingBarActions && floatingBarActions.length > 0 && (
          <FloatingBar table={table} actions={floatingBarActions} />
        )}
      </div>
    </DbFieldNamesProvider>
  )
}
