import type { FilterFn } from "@tanstack/react-table"
import type {
  TextFilterValue,
  NumberFilterValue,
  DateFilterValue,
  EnumFilterValue,
  BooleanFilterValue,
  FKFilterValue,
  DateFilterPreset,
} from "@/registry/default/lib/filter-types"

/**
 * Text column filter function
 * Supports: contains, notContains, equals, notEquals, startsWith, endsWith, isEmpty, isNotEmpty
 */
export const textFilterFn: FilterFn<unknown> = (row, columnId, filterValue) => {
  const filter = filterValue as TextFilterValue
  if (!filter || filter.operator === undefined) return true

  const cellValue = row.getValue(columnId)
  const value = String(cellValue ?? "").toLowerCase()
  const search = (filter.value ?? "").toLowerCase()

  switch (filter.operator) {
    case "contains":
      return value.includes(search)
    case "notContains":
      return !value.includes(search)
    case "equals":
      return value === search
    case "notEquals":
      return value !== search
    case "startsWith":
      return value.startsWith(search)
    case "endsWith":
      return value.endsWith(search)
    case "isEmpty":
      return !cellValue || value === ""
    case "isNotEmpty":
      return !!cellValue && value !== ""
    default:
      return true
  }
}

/**
 * Number column filter function
 * Supports: eq, neq, gt, gte, lt, lte, between, isEmpty, isNotEmpty
 */
export const numberFilterFn: FilterFn<unknown> = (row, columnId, filterValue) => {
  const filter = filterValue as NumberFilterValue
  if (!filter || filter.operator === undefined) return true

  const cellValue = row.getValue(columnId)

  // Handle isEmpty/isNotEmpty first
  if (filter.operator === "isEmpty") {
    return cellValue === null || cellValue === undefined
  }
  if (filter.operator === "isNotEmpty") {
    return cellValue !== null && cellValue !== undefined
  }

  // For other operators, we need both value and filter value
  if (cellValue === null || cellValue === undefined) return false
  if (filter.value === null || filter.value === undefined) return true

  const value = Number(cellValue)
  const target = Number(filter.value)

  switch (filter.operator) {
    case "eq":
      return value === target
    case "neq":
      return value !== target
    case "gt":
      return value > target
    case "gte":
      return value >= target
    case "lt":
      return value < target
    case "lte":
      return value <= target
    case "between":
      const valueTo =
        filter.valueTo !== null && filter.valueTo !== undefined ? Number(filter.valueTo) : target
      return value >= target && value <= valueTo
    default:
      return true
  }
}

/**
 * Get date range from preset
 */
function getDateRangeFromPreset(preset: DateFilterPreset): { from: Date; to: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  switch (preset) {
    case "today":
      return { from: today, to: tomorrow }
    case "yesterday": {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { from: yesterday, to: today }
    }
    case "thisWeek": {
      const startOfWeek = new Date(today)
      const day = startOfWeek.getDay()
      const diff = day === 0 ? 6 : day - 1 // Monday as first day
      startOfWeek.setDate(startOfWeek.getDate() - diff)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      return { from: startOfWeek, to: endOfWeek }
    }
    case "lastWeek": {
      const startOfLastWeek = new Date(today)
      const day = startOfLastWeek.getDay()
      const diff = day === 0 ? 6 : day - 1
      startOfLastWeek.setDate(startOfLastWeek.getDate() - diff - 7)
      const endOfLastWeek = new Date(startOfLastWeek)
      endOfLastWeek.setDate(endOfLastWeek.getDate() + 7)
      return { from: startOfLastWeek, to: endOfLastWeek }
    }
    case "thisMonth": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return { from: startOfMonth, to: endOfMonth }
    }
    case "lastMonth": {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: startOfLastMonth, to: endOfLastMonth }
    }
    case "last7Days": {
      const last7 = new Date(today)
      last7.setDate(last7.getDate() - 7)
      return { from: last7, to: tomorrow }
    }
    case "last30Days": {
      const last30 = new Date(today)
      last30.setDate(last30.getDate() - 30)
      return { from: last30, to: tomorrow }
    }
    case "last90Days": {
      const last90 = new Date(today)
      last90.setDate(last90.getDate() - 90)
      return { from: last90, to: tomorrow }
    }
    case "thisYear": {
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1)
      return { from: startOfYear, to: endOfYear }
    }
    default:
      return { from: today, to: tomorrow }
  }
}

/**
 * Date column filter function
 * Supports: equals, before, after, between, isEmpty, isNotEmpty
 * Also supports presets: today, yesterday, thisWeek, lastWeek, etc.
 */
export const dateFilterFn: FilterFn<unknown> = (row, columnId, filterValue) => {
  const filter = filterValue as DateFilterValue
  if (!filter) return true

  const cellValue = row.getValue(columnId)

  // Handle isEmpty/isNotEmpty first
  if (filter.operator === "isEmpty") {
    return cellValue === null || cellValue === undefined
  }
  if (filter.operator === "isNotEmpty") {
    return cellValue !== null && cellValue !== undefined
  }

  // For other operators, we need a cell value
  if (cellValue === null || cellValue === undefined) return false

  const cellDate = new Date(cellValue as string | number | Date)
  const cellTime = cellDate.getTime()

  // Handle presets
  if (filter.preset) {
    const { from, to } = getDateRangeFromPreset(filter.preset)
    return cellTime >= from.getTime() && cellTime < to.getTime()
  }

  // Handle manual date range
  const fromDate = filter.from ? new Date(filter.from) : null
  const toDate = filter.to ? new Date(filter.to) : null

  switch (filter.operator) {
    case "equals":
      if (!fromDate) return true
      // Compare dates without time
      const cellDateOnly = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate())
      const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
      return cellDateOnly.getTime() === fromDateOnly.getTime()
    case "before":
      if (!fromDate) return true
      return cellTime < fromDate.getTime()
    case "after":
      if (!fromDate) return true
      return cellTime > fromDate.getTime()
    case "between":
      if (!fromDate || !toDate) return true
      return cellTime >= fromDate.getTime() && cellTime <= toDate.getTime()
    default:
      // No operator but has from/to - treat as between
      if (fromDate && toDate) {
        return cellTime >= fromDate.getTime() && cellTime <= toDate.getTime()
      }
      if (fromDate) {
        return cellTime >= fromDate.getTime()
      }
      if (toDate) {
        return cellTime <= toDate.getTime()
      }
      return true
  }
}

/**
 * Enum column filter function
 * Filters by array of selected values (OR logic)
 */
export const enumFilterFn: FilterFn<unknown> = (row, columnId, filterValue) => {
  const selectedValues = filterValue as EnumFilterValue
  if (!selectedValues || selectedValues.length === 0) return true

  const cellValue = row.getValue(columnId)
  const valueStr = String(cellValue ?? "")

  return selectedValues.includes(valueStr)
}

/**
 * Boolean column filter function
 */
export const booleanFilterFn: FilterFn<unknown> = (row, columnId, filterValue) => {
  const filter = filterValue as BooleanFilterValue
  if (filter === null || filter === undefined) return true

  const cellValue = row.getValue(columnId)
  return Boolean(cellValue) === filter
}

/**
 * FK column filter function
 * Supports two modes:
 * 1. Text search - same operators as textFilterFn (contains, equals, etc.)
 * 2. ID selection - filter by array of selected FK IDs (including null for "Bez přiřazení")
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fkFilterFn: FilterFn<unknown> = (row, columnId, filterValue, addMeta) => {
  const filter = filterValue as FKFilterValue
  if (!filter) return true

  // Mode 1: Text search
  if (filter.textSearch?.operator) {
    const cellValue = row.getValue(columnId)
    const value = String(cellValue ?? "").toLowerCase()
    const search = (filter.textSearch.value ?? "").toLowerCase()

    switch (filter.textSearch.operator) {
      case "contains":
        return value.includes(search)
      case "notContains":
        return !value.includes(search)
      case "equals":
        return value === search
      case "notEquals":
        return value !== search
      case "startsWith":
        return value.startsWith(search)
      case "endsWith":
        return value.endsWith(search)
      case "isEmpty":
        return !cellValue || value === ""
      case "isNotEmpty":
        return !!cellValue && value !== ""
      default:
        return true
    }
  }

  // Mode 2: ID selection
  if (filter.selectedIds && filter.selectedIds.length > 0) {
    // Get the FK ID field from column meta
    const column = row._getAllCellsByColumnId()[columnId]?.column
    const fkIdField = column?.columnDef?.meta?.fkIdField

    if (!fkIdField) {
      // Fallback: try to filter by the display value if no fkIdField defined
      const cellValue = row.getValue(columnId)
      const valueStr = String(cellValue ?? "")
      return filter.selectedIds.some((id) => String(id) === valueStr)
    }

    // Get FK ID from row data
    const fkId = (row.original as Record<string, unknown>)[fkIdField] as number | null

    // Check if fkId matches any selected ID (including null for "Bez přiřazení")
    return filter.selectedIds.includes(fkId)
  }

  return true
}

/**
 * Get the appropriate filter function based on column type
 */
export function getFilterFnForType(columnType: string | undefined): FilterFn<unknown> {
  switch (columnType) {
    case "text":
    case "code":
    case "email":
    case "phone":
      return textFilterFn
    case "number":
    case "currency":
    case "percentage":
      return numberFilterFn
    case "date":
    case "datetime":
      return dateFilterFn
    case "enum":
      return enumFilterFn
    case "boolean":
      return booleanFilterFn
    case "fk":
      return fkFilterFn
    default:
      return textFilterFn
  }
}

/**
 * Smart filter function that delegates to the correct filter based on filter value structure
 * This is the default filter function used when no specific filterFn is set on a column
 * Note: Named "smart" instead of "auto" because TanStack Table has special handling for "auto"
 */
export const smartFilterFn: FilterFn<unknown> = (row, columnId, filterValue, addMeta) => {
  // Get the column type from meta
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const column = (row as { _valuesCache: Record<string, unknown> }).constructor
  // Fallback: try to detect filter type from value structure
  if (filterValue === null || filterValue === undefined) return true

  // Boolean filter
  if (typeof filterValue === "boolean") {
    return booleanFilterFn(row, columnId, filterValue, addMeta)
  }

  // Enum filter (array of strings)
  if (Array.isArray(filterValue)) {
    return enumFilterFn(row, columnId, filterValue, addMeta)
  }

  // Object-based filters
  if (typeof filterValue === "object") {
    const filter = filterValue as Record<string, unknown>

    // FK filter (has textSearch or selectedIds)
    if ("textSearch" in filter || "selectedIds" in filter) {
      return fkFilterFn(row, columnId, filterValue, addMeta)
    }

    // Date filter (has preset, from/to, or isEmpty/isNotEmpty operator)
    if (
      "preset" in filter ||
      "from" in filter ||
      "to" in filter ||
      filter.operator === "isEmpty" ||
      filter.operator === "isNotEmpty"
    ) {
      return dateFilterFn(row, columnId, filterValue, addMeta)
    }

    // Number filter (has operator and value is number or null)
    if (
      "operator" in filter &&
      "value" in filter &&
      (typeof filter.value === "number" || filter.value === null)
    ) {
      return numberFilterFn(row, columnId, filterValue, addMeta)
    }

    // Text filter (has operator and value is string)
    if ("operator" in filter && "value" in filter && typeof filter.value === "string") {
      return textFilterFn(row, columnId, filterValue, addMeta)
    }
  }

  // Fallback to text filter
  return textFilterFn(row, columnId, filterValue, addMeta)
}

/**
 * Registry of all custom filter functions for TanStack Table
 * Note: "smart" is used instead of "auto" because TanStack has special handling for "auto"
 */
export const filterFns = {
  smart: smartFilterFn,
  text: textFilterFn,
  number: numberFilterFn,
  date: dateFilterFn,
  enum: enumFilterFn,
  boolean: booleanFilterFn,
  fk: fkFilterFn,
}
