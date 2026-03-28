"use client"

import * as React from "react"
import { Loader2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EditableCellProps {
  /** Current value */
  value: unknown
  /** Callback when value should be saved */
  onSave: (value: unknown) => Promise<void>
  /** Whether the cell is currently saving */
  isSaving?: boolean
  /** Error message to display */
  error?: string | null
  /** Whether the cell is disabled */
  disabled?: boolean
  /** Placeholder for empty values */
  placeholder?: string
  /** Children render function */
  children: (props: {
    isEditing: boolean
    setIsEditing: (editing: boolean) => void
    currentValue: unknown
    setCurrentValue: (value: unknown) => void
    handleSave: () => void
    handleCancel: () => void
    handleKeyDown: (e: React.KeyboardEvent) => void
  }) => React.ReactNode
}

/**
 * Base wrapper component for editable cells
 * Handles editing state, keyboard navigation, and save/cancel logic
 *
 * Usage:
 * ```tsx
 * <EditableCell value={value} onSave={onSave}>
 *   {({ isEditing, setIsEditing, currentValue, setCurrentValue, handleSave, handleCancel, handleKeyDown }) => (
 *     isEditing ? (
 *       <Input
 *         value={currentValue}
 *         onChange={(e) => setCurrentValue(e.target.value)}
 *         onBlur={handleSave}
 *         onKeyDown={handleKeyDown}
 *         autoFocus
 *       />
 *     ) : (
 *       <span onDoubleClick={() => setIsEditing(true)}>{currentValue}</span>
 *     )
 *   )}
 * </EditableCell>
 * ```
 */
/* eslint-disable react-hooks/refs */
export function EditableCell({
  value,
  onSave,
  isSaving = false,
  error,
  disabled = false,
  children,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [currentValue, setCurrentValue] = React.useState(value)
  const originalValueRef = React.useRef(value)

  // Sync value from props when not editing
  React.useEffect(() => {
    if (!isEditing) {
      setCurrentValue(value)
      originalValueRef.current = value
    }
  }, [value, isEditing])

  const handleSave = React.useCallback(async () => {
    if (disabled || isSaving) return

    // Don't save if value hasn't changed
    if (currentValue === originalValueRef.current) {
      setIsEditing(false)
      return
    }

    try {
      await onSave(currentValue)
      originalValueRef.current = currentValue
      setIsEditing(false)
    } catch {
      // Error handled by parent, revert to original
      setCurrentValue(originalValueRef.current)
      setIsEditing(false)
    }
  }, [currentValue, disabled, isSaving, onSave])

  const handleCancel = React.useCallback(() => {
    setCurrentValue(originalValueRef.current)
    setIsEditing(false)
  }, [])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      } else if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
    },
    [handleSave, handleCancel]
  )

  return (
    <div className={cn("relative", error && "ring-destructive rounded ring-1")} data-editable-cell>
      {children({
        isEditing,
        setIsEditing: disabled ? () => {} : setIsEditing,
        currentValue,
        setCurrentValue,
        handleSave,
        handleCancel,
        handleKeyDown,
      })}
      {isSaving && (
        <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
          <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
        </div>
      )}
      {error && (
        <div className="text-destructive absolute -bottom-5 left-0 text-xs whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}

/**
 * Display wrapper for editable cell view
 * Handles click to enter edit mode with visual indicators
 */
export function EditableCellDisplay({
  children,
  onClick,
  onDoubleClick,
  disabled,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  /** @deprecated Use onClick instead */
  onDoubleClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const [isHovered, setIsHovered] = React.useState(false)
  const isEditable = (onClick || onDoubleClick) && !disabled

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return
    e.stopPropagation()
    onClick?.()
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (disabled) return
    e.stopPropagation()
    onDoubleClick?.()
  }

  return (
    <div
      onClick={onClick ? handleClick : undefined}
      onDoubleClick={onDoubleClick ? handleDoubleClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "-mx-1 flex min-h-[1.5rem] items-center gap-1 rounded px-1 transition-colors",
        // Editable styling - hover effect only
        isEditable && "hover:bg-muted/50 cursor-pointer",
        // Disabled/read-only
        disabled && "cursor-default",
        className
      )}
    >
      {children}
      {/* Pencil icon on hover for editable cells */}
      {isEditable && isHovered && (
        <Pencil className="text-muted-foreground/50 ml-auto h-3 w-3 shrink-0" />
      )}
    </div>
  )
}
