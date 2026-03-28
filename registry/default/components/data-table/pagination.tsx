"use client"

import { Table } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTablePagination<TData>({
  table,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value)
    table.setPageSize(newSize)
    onPageSizeChange?.(newSize)
  }

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-muted-foreground flex-1 text-sm">
        {(() => {
          const selectedCount = table.getFilteredSelectedRowModel().rows.length
          if (selectedCount === 0) return null
          return (
            <span>
              {selectedCount} z {table.getFilteredRowModel().rows.length} vybráno
            </span>
          )
        })()}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Řádků na stránku</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100, 250, 500].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Stránka {table.getState().pagination.pageIndex + 1} z {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Na první stránku</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Na předchozí stránku</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Na další stránku</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Na poslední stránku</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
