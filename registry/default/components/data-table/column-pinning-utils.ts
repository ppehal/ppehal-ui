import { Column, Table } from "@tanstack/react-table"

/**
 * Get CSS styles for a pinned column (header or cell)
 * Uses CSS sticky positioning with calculated offsets
 */
export function getPinnedColumnStyles<TData>(
  column: Column<TData, unknown>,
  table: Table<TData>
): React.CSSProperties {
  const isPinned = column.getIsPinned()

  if (!isPinned) {
    return { width: column.getSize() }
  }

  const isLeftPinned = isPinned === "left"

  // Calculate cumulative offset for left-pinned columns
  let offset = 0
  if (isLeftPinned) {
    const leftColumns = table.getLeftLeafColumns()
    const pinnedIndex = column.getPinnedIndex()
    for (let i = 0; i < pinnedIndex; i++) {
      offset += leftColumns[i].getSize()
    }
  } else {
    // Calculate offset for right-pinned columns (from right edge)
    const rightColumns = table.getRightLeafColumns()
    const pinnedIndex = column.getPinnedIndex()
    for (let i = rightColumns.length - 1; i > pinnedIndex; i--) {
      offset += rightColumns[i].getSize()
    }
  }

  return {
    width: column.getSize(),
    position: "sticky",
    left: isLeftPinned ? `${offset}px` : undefined,
    right: !isLeftPinned ? `${offset}px` : undefined,
    zIndex: 2,
  }
}

/**
 * Check if column is the last left-pinned or first right-pinned
 * Used for visual separator styling
 */
export function getPinnedBoundary<TData>(
  column: Column<TData, unknown>,
  table: Table<TData>
): { isLastLeft: boolean; isFirstRight: boolean } {
  const isPinned = column.getIsPinned()
  const pinnedIndex = column.getPinnedIndex()

  const isLastLeft = isPinned === "left" && pinnedIndex === table.getLeftLeafColumns().length - 1

  const isFirstRight = isPinned === "right" && pinnedIndex === 0

  return { isLastLeft, isFirstRight }
}

/**
 * Get CSS classes for pinned column visual styling
 */
export function getPinnedColumnClasses<TData>(
  column: Column<TData, unknown>,
  table: Table<TData>
): string {
  const classes: string[] = []
  const isPinned = column.getIsPinned()
  const { isLastLeft, isFirstRight } = getPinnedBoundary(column, table)

  if (isPinned) {
    // Solid background for pinned columns (overlays scrolling content)
    classes.push("bg-background")
  }

  if (isLastLeft) {
    // Subtle shadow on right edge of last left-pinned column
    classes.push("shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)]")
  }

  if (isFirstRight) {
    // Subtle shadow on left edge of first right-pinned column
    classes.push("shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]")
  }

  return classes.join(" ")
}

// Fixed column IDs that are always pinned
export const FIXED_LEFT_COLUMNS = ["select", "open-detail"]
export const FIXED_RIGHT_COLUMNS = ["actions"]

/**
 * Check if a column can be pinned/unpinned by user
 */
export function canPinColumn(columnId: string): boolean {
  return !FIXED_LEFT_COLUMNS.includes(columnId) && !FIXED_RIGHT_COLUMNS.includes(columnId)
}

/**
 * Enforce fixed columns in pinning state
 * Ensures select is always left, actions always right
 */
export function enforceFixedPinning(userPinning: { left?: string[]; right?: string[] }): {
  left: string[]
  right: string[]
} {
  const userLeft =
    userPinning.left?.filter(
      (id) => !FIXED_LEFT_COLUMNS.includes(id) && !FIXED_RIGHT_COLUMNS.includes(id)
    ) || []

  const userRight =
    userPinning.right?.filter(
      (id) => !FIXED_LEFT_COLUMNS.includes(id) && !FIXED_RIGHT_COLUMNS.includes(id)
    ) || []

  return {
    left: [...FIXED_LEFT_COLUMNS, ...userLeft],
    right: [...userRight, ...FIXED_RIGHT_COLUMNS],
  }
}
