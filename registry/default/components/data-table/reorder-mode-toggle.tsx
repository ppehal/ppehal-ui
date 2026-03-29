"use client"

import * as React from "react"
import { ArrowUpDown, GripVertical } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { cn } from "@/lib/utils"

interface ReorderModeToggleProps {
  isReorderMode: boolean
  onToggle: (reorderMode: boolean) => void
}

export function ReorderModeToggle({ isReorderMode, onToggle }: ReorderModeToggleProps) {
  return (
    <div className="flex rounded-md border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(true)}
        className={cn(
          "h-8 gap-1.5 rounded-r-none border-r px-3 text-xs",
          isReorderMode && "bg-accent text-accent-foreground"
        )}
      >
        <GripVertical className="h-3.5 w-3.5" />
        Pořadí
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(false)}
        className={cn(
          "h-8 gap-1.5 rounded-l-none px-3 text-xs",
          !isReorderMode && "bg-accent text-accent-foreground"
        )}
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        Procházení
      </Button>
    </div>
  )
}
