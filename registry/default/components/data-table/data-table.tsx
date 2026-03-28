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

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/registry/default/ui/table"
import { DataTablePagination } from "./pagination"
import { SortableTableHeaderRow } from "./sortable-table-header-row"
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
    resetAll: () => void
  ) => React.ReactNode
  isLoading?: boolean
  floatingBarActions?: FloatingBarAction<TData>[]
  activeRowId?: string | number
  /** Table meta for callbacks (onOpenDetail, updateData, etc.) */
  meta?: Record<string, unknown>
  /** Optional expandable rows configuration */
  expandable?: ExpandableConfig<TData>
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
}: DataTableProps<TData, TValue>) {
  // Construct effective table ID for per-view storage
  const effectiveTableId = viewId ? `${tableId}_${viewId}` : tableId

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

  // Reset to first page when data changes
  React.useEffect(() => {
    setPageIndex(0)
  }, [data])

  // Reset expanded state when data, sorting, or filters change
  React.useEffect(() => {
    setExpanded({})
  }, [data, preferences.sorting, columnFilters])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: preferences.sorting,
      columnVisibility: preferences.columnVisibility,
      columnSizing: preferences.columnSizing,
      columnOrder: preferences.columnOrder,
      columnPinning: enforcedColumnPinning,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex,
        pageSize: preferences.pageSize,
      },
      // Only include expanded state if expandable is enabled
      ...(expandable && { expanded }),
    },
    filterFns,
    defaultColumn: {
      // Use "smart" instead of "auto" - TanStack has special handling for "auto" that bypasses filterFns
      filterFn: "smart" as never,
    },
    enableRowSelection: true,
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
        {toolbar && toolbar(table, preferences.rowDensity, setRowDensity, resetAll)}
        <div ref={tableWrapperRef} className="relative">
          <div className="rounded-md border">
            <Table
              data-density={preferences.rowDensity}
              style={{
                width: table.getCenterTotalSize(),
                tableLayout: "fixed",
              }}
            >
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <SortableTableHeaderRow
                    key={headerGroup.id}
                    headerGroup={headerGroup}
                    table={table}
                    onColumnOrderChange={setColumnOrder}
                  />
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
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
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Žádné výsledky.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
        <DataTablePagination table={table} />

        {/* Floating bulk actions bar */}
        {floatingBarActions && floatingBarActions.length > 0 && (
          <FloatingBar table={table} actions={floatingBarActions} />
        )}
      </div>
    </DbFieldNamesProvider>
  )
}
