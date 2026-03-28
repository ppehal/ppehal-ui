"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/registry/default/ui/checkbox"
import { DataTableColumnHeader } from "./column-header"
import { NullValue } from "@/registry/default/ui/null-value"

/**
 * Creates a standard select checkbox column for row selection.
 * This eliminates duplicated checkbox column code across all *-columns.tsx files.
 *
 * @example
 * export function getCaseColumns(): ColumnDef<CaseListItem>[] {
 *   return [
 *     createSelectColumn<CaseListItem>(),
 *     // ... other columns
 *   ]
 * }
 */
export function createSelectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    size: 40,
    minSize: 40,
    maxSize: 40,
    enableResizing: false,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Vybrat vše"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Vybrat řádek"
        className="translate-y-[2px]"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

/**
 * Category level type for 4-level hierarchy
 */
export type CategoryLevel = 1 | 2 | 3 | 4

/**
 * Configuration for category column
 */
export interface CategoryColumnConfig {
  level: CategoryLevel
  size?: number
  minSize?: number
  maxSize?: number
}

/**
 * Creates a category column for the 4-level category hierarchy.
 * Eliminates duplicated category column definitions across payment-columns, payment-rule-columns, etc.
 *
 * @param config Configuration with level (1-4) and optional size overrides
 * @returns Column definition for the category level
 *
 * @example
 * export function getPaymentColumns(): ColumnDef<PaymentListItem>[] {
 *   return [
 *     createCategoryColumn<PaymentListItem>({ level: 1 }),
 *     createCategoryColumn<PaymentListItem>({ level: 2 }),
 *     createCategoryColumn<PaymentListItem>({ level: 3 }),
 *     createCategoryColumn<PaymentListItem>({ level: 4 }),
 *   ]
 * }
 */
/**
 * Required fields for category columns
 */
export interface CategoryColumnFields {
  category_l1_name?: string | null
  category_l2_name?: string | null
  category_l3_name?: string | null
  category_l4_name?: string | null
}

export function createCategoryColumn<T extends CategoryColumnFields>(
  config: CategoryColumnConfig
): ColumnDef<T> {
  const { level, size = 120, minSize = 80, maxSize = 500 } = config
  const accessorKey = `category_l${level}_name` as keyof T & string
  const title = `Kat. L${level}`

  return {
    accessorKey,
    size,
    minSize,
    maxSize,
    meta: { title, columnType: "text" },
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
    cell: ({ row }) => {
      const name = row.original[accessorKey] as string | null | undefined
      if (!name) return <NullValue italic />
      return (
        <div className="truncate text-sm" title={name}>
          {name}
        </div>
      )
    },
  }
}

/**
 * Creates all 4 category columns at once.
 * Convenience function for when all 4 levels are needed.
 *
 * @example
 * export function getPaymentColumns(): ColumnDef<PaymentListItem>[] {
 *   return [
 *     // ... other columns
 *     ...createAllCategoryColumns<PaymentListItem>(),
 *     // ... more columns
 *   ]
 * }
 */
export function createAllCategoryColumns<T extends CategoryColumnFields>(): ColumnDef<T>[] {
  return [
    createCategoryColumn<T>({ level: 1 }),
    createCategoryColumn<T>({ level: 2 }),
    createCategoryColumn<T>({ level: 3 }),
    createCategoryColumn<T>({ level: 4 }),
  ]
}
