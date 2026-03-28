"use client"

import * as React from "react"
import { type ColumnDef, type RowData } from "@tanstack/react-table"
import { PanelRightOpen } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip"

/**
 * Creates an "Open Detail" column for DataTable
 * This column provides a button to open the detail sheet/panel for a row
 *
 * Usage:
 * ```tsx
 * const columns = [
 *   createOpenDetailColumn<MyData>(),
 *   // ... other columns
 * ]
 * ```
 *
 * Requires table.options.meta.onOpenDetail to be set:
 * ```tsx
 * <DataTable
 *   meta={{ onOpenDetail: (row) => openDetailSheet(row) }}
 * />
 * ```
 */
export function createOpenDetailColumn<TData extends RowData>(): ColumnDef<TData> {
  return {
    id: "open-detail",
    size: 40,
    minSize: 40,
    maxSize: 40,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    header: () => null,
    cell: ({ row, table }) => {
      const onOpenDetail = table.options.meta?.onOpenDetail as ((row: TData) => void) | undefined

      if (!onOpenDetail) return null

      return (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenDetail(row.original)
                }}
              >
                <PanelRightOpen className="h-4 w-4" />
                <span className="sr-only">Otevřít detail</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Otevřít detail</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  }
}
