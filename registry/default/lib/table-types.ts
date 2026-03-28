import "@tanstack/react-table"
import type { RowData } from "@tanstack/react-table"
import type { z } from "zod"

/**
 * Column data types for displaying type icons in table headers
 */
export type ColumnDataType =
  | "text"
  | "number"
  | "percentage"
  | "currency"
  | "date"
  | "datetime"
  | "enum"
  | "boolean"
  | "email"
  | "phone"
  | "code"
  | "fk" // Foreign key - hybrid filter (text search + selection)

/**
 * Editable column types for inline editing
 */
export type EditableColumnType =
  | "text"
  | "number"
  | "currency"
  | "select"
  | "date"
  | "boolean"
  | "combobox"

/**
 * Entity types for FK columns (maps to EntityChip entityType)
 */
export type FKEntityType =
  | "case"
  | "entity"
  | "investor"
  | "investment"
  | "source"
  | "client"
  | "bank"
  | "party"
  | "email"

/**
 * Filter option for enum columns
 */
export interface FilterOption {
  value: string
  label: string
  count?: number // Optional count for faceted filtering
  is_active?: boolean // Optional flag for inactive items toggle
  group?: string // Optional group name for hierarchical display
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Display title for the column (shown in column visibility dropdown)
     */
    title?: string
    /**
     * Data type of the column (for displaying type icon in header)
     */
    columnType?: ColumnDataType
    /**
     * Available options for enum filter (multi-select)
     */
    filterOptions?: FilterOption[]
    /**
     * Enable/disable column filtering (defaults to true)
     */
    enableColumnFilter?: boolean
    /**
     * FK entity type for fk columns (determines which loader to use)
     */
    fkEntity?: FKEntityType
    /**
     * Field name containing the FK ID (for filtering by ID)
     * Example: "case_id" for case_code column
     */
    fkIdField?: string
    /**
     * Server action to load FK options dynamically
     * Returns Promise<FilterOption[]> with id as value and display name as label
     */
    fkOptionsLoader?: () => Promise<FilterOption[]>

    // ========== INLINE EDITING ==========

    /**
     * Enable inline editing for this column
     */
    editable?: boolean
    /**
     * Type of editable input (determines which EditableCell component to use)
     */
    editableType?: EditableColumnType
    /**
     * Database field name for updates (defaults to accessorKey)
     * Use when accessorKey differs from actual DB field
     */
    editableField?: string
    /**
     * Zod schema for client-side validation
     */
    validation?: z.ZodTypeAny
    /**
     * Options for select-type editable columns
     * Same format as filterOptions
     */
    editableOptions?: FilterOption[]
    /**
     * Placeholder text for input when editing
     */
    editablePlaceholder?: string
    /**
     * Format function for displaying non-editing value
     * If not provided, raw value is displayed
     */
    formatValue?: (value: unknown) => string

    // ========== ADMIN FEATURES ==========

    /**
     * Database field name for admin display
     * If not provided, uses fkIdField (for FK columns) or column.id
     * Use when display accessor differs from actual DB field
     * Example: FK column with accessorKey "client_name" but DB field "current_client_id"
     */
    dbFieldName?: string
  }

  interface TableMeta<TData extends RowData> {
    /**
     * Callback to open detail panel/sheet for a row
     * Used by open-detail column
     */
    onOpenDetail?: (row: TData) => void
    /**
     * Update a single field value (for inline editing)
     * @param rowId - The row identifier (typically row.id)
     * @param columnId - The column accessor key
     * @param value - New value to set
     * @returns Promise that resolves when update completes
     */
    updateData?: (rowId: string | number, columnId: string, value: unknown) => Promise<void>
    /**
     * Get original data for a row (for revert on error)
     */
    getOriginalData?: (rowId: string | number) => TData | undefined
    /**
     * Set of cells currently being saved (for loading states)
     * Format: "rowId-columnId"
     */
    savingCells?: Set<string>
    /**
     * Show DB field names in column headers (admin feature)
     */
    showDbFieldNames?: boolean
  }
}
