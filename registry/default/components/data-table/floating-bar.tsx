"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { cn } from "@/lib/utils"

export interface FloatingBarAction<TData> {
  label: string
  icon?: React.ReactNode
  onClick: (selectedRows: TData[]) => void | Promise<void>
  variant?: "default" | "destructive"
}

interface FloatingBarProps<TData> {
  table: Table<TData>
  actions: FloatingBarAction<TData>[]
}

export function FloatingBar<TData>({ table, actions }: FloatingBarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  if (selectedCount === 0) return null

  const selectedData = selectedRows.map((row) => row.original)

  return (
    <div
      role="toolbar"
      aria-label="Akce pro vybrané řádky"
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
        "flex items-center gap-2 px-4 py-2",
        "bg-background rounded-lg border shadow-lg",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
    >
      <span className="text-muted-foreground text-sm font-medium">{selectedCount} vybráno</span>

      <div className="bg-border mx-2 h-4 w-px" />

      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant === "destructive" ? "destructive" : "secondary"}
          size="sm"
          onClick={() => action.onClick(selectedData)}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}

      <div className="bg-border mx-2 h-4 w-px" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => table.resetRowSelection()}
        aria-label="Zrušit výběr"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
