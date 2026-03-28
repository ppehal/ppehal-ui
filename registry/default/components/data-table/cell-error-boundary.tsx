"use client"

import React from "react"
import { AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/default/ui/tooltip"

interface CellErrorBoundaryProps {
  children: React.ReactNode
  /** Column ID for error logging */
  columnId?: string
}

interface CellErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Lightweight error boundary for DataTable cells.
 *
 * Isolates cell render errors to prevent entire table crashes.
 * Shows an error icon with tooltip instead of crashing the row.
 */
export class CellErrorBoundary extends React.Component<
  CellErrorBoundaryProps,
  CellErrorBoundaryState
> {
  state: CellErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): CellErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    const columnId = this.props.columnId || "unknown"
    console.error(`[CellError:${columnId}]`, error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center justify-center">
              <AlertCircle className="text-destructive h-4 w-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="max-w-[200px] text-xs">
              Chyba: {this.state.error?.message || "Neznámá chyba"}
            </p>
          </TooltipContent>
        </Tooltip>
      )
    }
    return this.props.children
  }
}
