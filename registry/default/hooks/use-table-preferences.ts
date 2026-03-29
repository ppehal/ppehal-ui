"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import type {
  VisibilityState,
  SortingState,
  ColumnSizingState,
  ColumnOrderState,
  ColumnPinningState,
} from "@tanstack/react-table"
import { getStoredValue, setStoredValue } from "@/registry/default/lib/storage/browser-storage"

export type RowDensity = "compact" | "default" | "spacious"

export interface TablePreferences {
  pageSize: number
  columnVisibility: VisibilityState
  sorting: SortingState
  columnSizing: ColumnSizingState
  columnOrder: ColumnOrderState
  columnPinning: ColumnPinningState
  sheetWidth: number
  rowDensity: RowDensity
  showDbFieldNames: boolean
  /** Whether row reorder mode is active (only used when reorderAction is provided) */
  reorderMode: boolean
}

const DEFAULT_PREFERENCES: TablePreferences = {
  pageSize: 25,
  columnVisibility: {},
  sorting: [],
  columnSizing: {},
  columnOrder: [],
  columnPinning: { left: [], right: [] },
  sheetWidth: 800,
  rowDensity: "compact",
  showDbFieldNames: false,
  reorderMode: false,
}

export interface TablePreferencesOptions {
  defaultColumnVisibility?: VisibilityState
  defaultSorting?: SortingState
  defaultColumnOrder?: ColumnOrderState
  defaultColumnPinning?: ColumnPinningState
}

export function useTablePreferences(tableId: string, options?: TablePreferencesOptions) {
  const {
    defaultColumnVisibility = {},
    defaultSorting,
    defaultColumnOrder,
    defaultColumnPinning,
  } = options ?? {}
  const storageKey = `table_${tableId}`

  // Compute effective defaults with per-view overrides
  const effectiveDefaults = React.useMemo<TablePreferences>(
    () => ({
      ...DEFAULT_PREFERENCES,
      columnVisibility: defaultColumnVisibility,
      ...(defaultSorting && { sorting: defaultSorting }),
      ...(defaultColumnOrder && { columnOrder: defaultColumnOrder }),
      ...(defaultColumnPinning && { columnPinning: defaultColumnPinning }),
    }),
    [defaultColumnVisibility, defaultSorting, defaultColumnOrder, defaultColumnPinning]
  )

  // Track if we've hydrated from localStorage
  const isHydrated = useRef(false)

  // Always start with defaults to prevent hydration mismatch
  const [preferences, setPreferencesState] = useState<TablePreferences>(effectiveDefaults)

  // Load from localStorage after mount (client-side only)
  useEffect(() => {
    if (isHydrated.current) return
    isHydrated.current = true

    const parsed = getStoredValue<TablePreferences | null>(storageKey, null)
    if (parsed) {
      // Use startTransition to mark this as a non-urgent update
      React.startTransition(() => {
        // Merge: effectiveDefaults < stored preferences
        // But only use stored columnVisibility/columnOrder if user has customized them
        const hasStoredVisibility =
          parsed.columnVisibility && Object.keys(parsed.columnVisibility).length > 0
        const hasStoredOrder = parsed.columnOrder && parsed.columnOrder.length > 0
        // For pinning: existence of key means user has preferences (even empty)
        const hasStoredPinning = "columnPinning" in parsed
        setPreferencesState({
          ...effectiveDefaults,
          ...parsed,
          // Use stored visibility only if it exists, otherwise use defaults
          columnVisibility: hasStoredVisibility
            ? parsed.columnVisibility
            : effectiveDefaults.columnVisibility,
          // Use stored order only if it exists, otherwise use defaults
          columnOrder: hasStoredOrder ? parsed.columnOrder : effectiveDefaults.columnOrder,
          // Use stored pinning only if key exists, otherwise use defaults
          columnPinning: hasStoredPinning ? parsed.columnPinning : effectiveDefaults.columnPinning,
        })
      })
    } else {
      // No stored preferences - use effective defaults
      React.startTransition(() => {
        setPreferencesState(effectiveDefaults)
      })
    }
  }, [storageKey, effectiveDefaults])

  // Sync to localStorage when preferences change (skip initial hydration)
  useEffect(() => {
    // Skip saving during hydration
    if (!isHydrated.current) return

    setStoredValue(storageKey, preferences)
  }, [preferences, storageKey])

  const setPreferences = useCallback((update: Partial<TablePreferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...update }))
  }, [])

  const setPageSize = useCallback(
    (pageSize: number) => {
      setPreferences({ pageSize })
    },
    [setPreferences]
  )

  const setColumnVisibility = useCallback(
    (columnVisibility: VisibilityState) => {
      setPreferences({ columnVisibility })
    },
    [setPreferences]
  )

  const setSorting = useCallback(
    (sorting: SortingState) => {
      setPreferences({ sorting })
    },
    [setPreferences]
  )

  const setColumnSizing = useCallback(
    (columnSizing: ColumnSizingState) => {
      setPreferences({ columnSizing })
    },
    [setPreferences]
  )

  const resetColumnSizing = useCallback(() => {
    setPreferences({ columnSizing: {} })
  }, [setPreferences])

  const setColumnOrder = useCallback(
    (columnOrder: ColumnOrderState) => {
      setPreferences({ columnOrder })
    },
    [setPreferences]
  )

  const resetColumnOrder = useCallback(() => {
    setPreferences({ columnOrder: [] })
  }, [setPreferences])

  const setColumnPinning = useCallback(
    (columnPinning: ColumnPinningState) => {
      setPreferences({ columnPinning })
    },
    [setPreferences]
  )

  const resetColumnPinning = useCallback(() => {
    setPreferences({ columnPinning: effectiveDefaults.columnPinning })
  }, [setPreferences, effectiveDefaults])

  const resetAll = useCallback(() => {
    // Reset to effective defaults for immediate correct behavior
    // Empty values would only apply defaults after page reload
    setPreferences({
      columnVisibility: effectiveDefaults.columnVisibility,
      columnOrder: effectiveDefaults.columnOrder,
      columnPinning: effectiveDefaults.columnPinning,
      sorting: effectiveDefaults.sorting,
    })
  }, [setPreferences, effectiveDefaults])

  const setSheetWidth = useCallback(
    (sheetWidth: number) => {
      setPreferences({ sheetWidth })
    },
    [setPreferences]
  )

  const setRowDensity = useCallback(
    (rowDensity: RowDensity) => {
      setPreferences({ rowDensity })
    },
    [setPreferences]
  )

  const setShowDbFieldNames = useCallback(
    (showDbFieldNames: boolean) => {
      setPreferences({ showDbFieldNames })
    },
    [setPreferences]
  )

  const setReorderMode = useCallback(
    (reorderMode: boolean) => {
      setPreferences({ reorderMode })
    },
    [setPreferences]
  )

  return {
    preferences,
    setPreferences,
    setPageSize,
    setColumnVisibility,
    setSorting,
    setColumnSizing,
    resetColumnSizing,
    setColumnOrder,
    resetColumnOrder,
    setColumnPinning,
    resetColumnPinning,
    resetAll,
    setSheetWidth,
    setRowDensity,
    setShowDbFieldNames,
    setReorderMode,
  }
}
