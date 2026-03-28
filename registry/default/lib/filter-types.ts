/**
 * Filter value types for column filtering
 */

// Text filter operators
export type TextFilterOperator =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty"

// Text filter value
export interface TextFilterValue {
  operator: TextFilterOperator
  value: string
}

// Number filter operators
export type NumberFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "isEmpty"
  | "isNotEmpty"

// Number filter value
export interface NumberFilterValue {
  operator: NumberFilterOperator
  value: number | null
  valueTo?: number | null // For "between" operator
}

// Date filter operators
export type DateFilterOperator =
  | "equals"
  | "before"
  | "after"
  | "between"
  | "isEmpty"
  | "isNotEmpty"

// Date filter presets
export type DateFilterPreset =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "last7Days"
  | "last30Days"
  | "last90Days"
  | "thisYear"

// Date filter value
export interface DateFilterValue {
  operator?: DateFilterOperator
  preset?: DateFilterPreset
  from?: Date | string
  to?: Date | string
}

// Enum filter value (array of selected values)
export type EnumFilterValue = string[]

// Boolean filter value
export type BooleanFilterValue = boolean | null

// FK filter value - supports both text search and ID selection
export interface FKFilterValue {
  // Text search mode (same operators as TextFilter)
  textSearch?: {
    operator: TextFilterOperator
    value: string
  }
  // Selection mode - array of selected FK IDs (null = "Bez přiřazení")
  selectedIds?: (number | null)[]
}

// Union type for all filter values
export type ColumnFilterValue =
  | TextFilterValue
  | NumberFilterValue
  | DateFilterValue
  | EnumFilterValue
  | BooleanFilterValue
  | FKFilterValue

// Operator labels for UI
export const TEXT_OPERATOR_LABELS: Record<TextFilterOperator, string> = {
  contains: "obsahuje",
  notContains: "neobsahuje",
  equals: "je přesně",
  notEquals: "není",
  startsWith: "začíná na",
  endsWith: "končí na",
  isEmpty: "je prázdné",
  isNotEmpty: "není prázdné",
}

export const NUMBER_OPERATOR_LABELS: Record<NumberFilterOperator, string> = {
  eq: "=",
  neq: "≠",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  between: "mezi",
  isEmpty: "je prázdné",
  isNotEmpty: "není prázdné",
}

export const DATE_OPERATOR_LABELS: Record<DateFilterOperator, string> = {
  equals: "je přesně",
  before: "před",
  after: "po",
  between: "mezi",
  isEmpty: "je prázdné",
  isNotEmpty: "není prázdné",
}

export const DATE_PRESET_LABELS: Record<DateFilterPreset, string> = {
  today: "Dnes",
  yesterday: "Včera",
  thisWeek: "Tento týden",
  lastWeek: "Minulý týden",
  thisMonth: "Tento měsíc",
  lastMonth: "Minulý měsíc",
  last7Days: "Posledních 7 dní",
  last30Days: "Posledních 30 dní",
  last90Days: "Posledních 90 dní",
  thisYear: "Tento rok",
}
