"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/default/ui/dropdown-menu"

export interface RowAction<TData> {
  label: string
  icon?: React.ReactNode
  onClick: (row: TData) => void
  variant?: "default" | "destructive"
  separator?: boolean
}

interface DataTableRowActionsProps<TData> {
  row: TData
  actions: RowAction<TData>[]
}

export function DataTableRowActions<TData>({ row, actions }: DataTableRowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Otevřít menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            {action.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                action.onClick(row)
              }}
              className={
                action.variant === "destructive"
                  ? "text-destructive focus:text-destructive"
                  : undefined
              }
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
