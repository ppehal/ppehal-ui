"use client"

import * as React from "react"
import { Undo2, Redo2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip"
import { Button } from "@/registry/default/ui/button"

interface UndoRedoIndicatorProps {
  /** Whether undo is available */
  canUndo: boolean
  /** Whether redo is available */
  canRedo: boolean
  /** Whether an undo operation is in progress */
  isUndoing: boolean
  /** Whether a redo operation is in progress */
  isRedoing: boolean
  /** Callback for undo action */
  onUndo: () => void
  /** Callback for redo action */
  onRedo: () => void
  /** Number of items in undo stack (for display) */
  undoCount?: number
  /** Number of items in redo stack (for display) */
  redoCount?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Visual indicator for undo/redo functionality
 * Shows buttons with tooltips and loading states
 */
export function UndoRedoIndicator({
  canUndo,
  canRedo,
  isUndoing,
  isRedoing,
  onUndo,
  onRedo,
  undoCount = 0,
  redoCount = 0,
  className,
}: UndoRedoIndicatorProps) {
  // Don't render anything if there's nothing to undo/redo
  if (undoCount === 0 && redoCount === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-0.5", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onUndo}
              disabled={!canUndo}
            >
              {isUndoing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4" />
              )}
              <span className="sr-only">Zpět</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              Zpět (Ctrl+Z)
              {undoCount > 0 && (
                <span className="text-muted-foreground ml-1">
                  {undoCount} {undoCount === 1 ? "změna" : undoCount < 5 ? "změny" : "změn"}
                </span>
              )}
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRedo}
              disabled={!canRedo}
            >
              {isRedoing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Redo2 className="h-4 w-4" />
              )}
              <span className="sr-only">Vpřed</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              Vpřed (Ctrl+Y)
              {redoCount > 0 && (
                <span className="text-muted-foreground ml-1">
                  {redoCount} {redoCount === 1 ? "změna" : redoCount < 5 ? "změny" : "změn"}
                </span>
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
