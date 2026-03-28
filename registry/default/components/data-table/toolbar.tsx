"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { ColumnConfigPanel } from "./column-config-panel"
import { DensityToggle } from "./density-toggle"
import type { RowDensity } from "@/registry/default/hooks/use-table-preferences"
import type {
  TextFilterValue,
  NumberFilterValue,
  DateFilterValue,
  EnumFilterValue,
} from "@/registry/default/lib/filter-types"
import { TEXT_OPERATOR_LABELS, NUMBER_OPERATOR_LABELS, DATE_PRESET_LABELS } from "@/registry/default/lib/filter-types"

// Format filter value for display - exported for use in ActiveFilters
export function formatFilterValue(filterValue: unknown, _columnType?: string): string {
  if (filterValue === null || filterValue === undefined) return ""

  // Check if it's an object with operator
  if (typeof filterValue === "object" && "operator" in (filterValue as object)) {
    const filter = filterValue as { operator: string; value?: unknown; valueTo?: unknown }

    // isEmpty/isNotEmpty - common for both text and number
    if (filter.operator === "isEmpty") return "je prázdné"
    if (filter.operator === "isNotEmpty") return "není prázdné"

    // Number filter - value is number or null
    if (typeof filter.value === "number" || filter.value === null) {
      const numFilter = filterValue as NumberFilterValue
      const opLabel = NUMBER_OPERATOR_LABELS[numFilter.operator] || numFilter.operator
      if (
        numFilter.operator === "between" &&
        numFilter.valueTo !== null &&
        numFilter.valueTo !== undefined
      ) {
        return `${numFilter.value} – ${numFilter.valueTo}`
      }
      return `${opLabel} ${numFilter.value}`
    }

    // Text filter - value is string
    if (typeof filter.value === "string") {
      const textFilter = filterValue as TextFilterValue
      const opLabel = TEXT_OPERATOR_LABELS[textFilter.operator] || textFilter.operator
      return `${opLabel}: ${textFilter.value}`
    }
  }

  // Date filter
  if (
    typeof filterValue === "object" &&
    ("preset" in (filterValue as object) || "from" in (filterValue as object))
  ) {
    const dateFilter = filterValue as DateFilterValue
    if (dateFilter.operator === "isEmpty") return "je prázdné"
    if (dateFilter.operator === "isNotEmpty") return "není prázdné"
    if (dateFilter.preset) {
      return DATE_PRESET_LABELS[dateFilter.preset] || dateFilter.preset
    }
    if (dateFilter.from && dateFilter.to) {
      const from = new Date(dateFilter.from)
      const to = new Date(dateFilter.to)
      return `${from.toLocaleDateString("cs-CZ")} - ${to.toLocaleDateString("cs-CZ")}`
    }
    if (dateFilter.from) {
      const from = new Date(dateFilter.from)
      return `od ${from.toLocaleDateString("cs-CZ")}`
    }
    if (dateFilter.to) {
      const to = new Date(dateFilter.to)
      return `do ${to.toLocaleDateString("cs-CZ")}`
    }
    return ""
  }

  // Enum filter (array of values)
  if (Array.isArray(filterValue)) {
    const enumFilter = filterValue as EnumFilterValue
    if (enumFilter.length === 0) return ""
    if (enumFilter.length === 1) return enumFilter[0]
    return `${enumFilter.length} vybrán${enumFilter.length > 4 ? "o" : enumFilter.length > 1 ? "y" : ""}`
  }

  // Boolean filter
  if (typeof filterValue === "boolean") {
    return filterValue ? "Ano" : "Ne"
  }

  return String(filterValue)
}

interface DataTableToolbarProps<TData> {
  table?: Table<TData> | null
  children?: React.ReactNode
  onResetFilters?: () => void
  hasActiveFilters?: boolean
  onColumnOrderChange?: (newOrder: string[]) => void
  onResetAll?: () => void
  density?: RowDensity
  onDensityChange?: (density: RowDensity) => void
}

export function DataTableToolbar<TData>({
  table,
  children,
  onResetFilters,
  hasActiveFilters,
  onColumnOrderChange,
  onResetAll,
  density,
  onDensityChange,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {children}

        {/* Legacy reset button for external filters */}
        {hasActiveFilters && onResetFilters && (
          <Button variant="ghost" onClick={onResetFilters} className="h-8 px-2 lg:px-3">
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {density && onDensityChange && <DensityToggle value={density} onChange={onDensityChange} />}
        {table && onColumnOrderChange && (
          <ColumnConfigPanel
            table={table}
            columnOrder={table.getState().columnOrder}
            onColumnOrderChange={onColumnOrderChange}
            onResetAll={onResetAll}
          />
        )}
      </div>
    </div>
  )
}
