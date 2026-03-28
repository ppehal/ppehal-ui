import { Column, Table } from "@tanstack/react-table"
import "@/registry/default/lib/table-types"

/**
 * Get display title for a column
 * Uses meta.title if available, otherwise formats column.id
 */
export function getColumnTitle<TData>(column: Column<TData, unknown>): string {
  // 1. Try meta.title first
  if (column.columnDef.meta?.title) {
    return column.columnDef.meta.title
  }

  // 2. Fallback: convert snake_case to Title Case
  return column.id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Get all columns that can be hidden by the user
 * Excludes columns without accessorFn (like select, actions) and those with enableHiding: false
 */
export function getHideableColumns<TData>(table: Table<TData>) {
  return table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
}

/**
 * Show all hideable columns
 */
export function showAllColumns<TData>(table: Table<TData>) {
  getHideableColumns(table).forEach((column) => {
    column.toggleVisibility(true)
  })
}

/**
 * Hide all hideable columns
 */
export function hideAllColumns<TData>(table: Table<TData>) {
  getHideableColumns(table).forEach((column) => {
    column.toggleVisibility(false)
  })
}

/**
 * Reset column visibility to default (all visible)
 */
export function resetColumnVisibility<TData>(table: Table<TData>) {
  table.resetColumnVisibility()
}
