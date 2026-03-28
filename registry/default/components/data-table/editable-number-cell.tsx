"use client"

import * as React from "react"
import { Input } from "@/registry/default/ui/input"
import { EditableCell, EditableCellDisplay } from "./editable-cell"

interface EditableNumberCellProps {
  /** Current value */
  value: number | null | undefined
  /** Callback when value should be saved */
  onSave: (value: number | null) => Promise<void>
  /** Whether the cell is currently saving */
  isSaving?: boolean
  /** Error message */
  error?: string | null
  /** Placeholder for empty values */
  placeholder?: string
  /** Whether editing is disabled */
  disabled?: boolean
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step for input */
  step?: number
  /** Suffix to display after value (e.g., "%") */
  suffix?: string
  /** Number of decimal places for display */
  decimalPlaces?: number
}

/**
 * Editable number cell component
 * Double-click to edit, Enter/blur to save, Escape to cancel
 */
export function EditableNumberCell({
  value,
  onSave,
  isSaving,
  error,
  placeholder = "—",
  disabled,
  min,
  max,
  step = 1,
  suffix,
  decimalPlaces,
}: EditableNumberCellProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSave = async (newValue: unknown) => {
    const strValue = newValue as string
    if (strValue === "" || strValue === null || strValue === undefined) {
      await onSave(null)
      return
    }
    const numValue = parseFloat(strValue)
    if (isNaN(numValue)) {
      await onSave(null)
      return
    }
    await onSave(numValue)
  }

  const formatDisplay = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return ""
    if (decimalPlaces !== undefined) {
      return val.toFixed(decimalPlaces)
    }
    return String(val)
  }

  return (
    <EditableCell
      value={value ?? ""}
      onSave={handleSave}
      isSaving={isSaving}
      error={error}
      disabled={disabled}
    >
      {({
        isEditing,
        setIsEditing,
        currentValue,
        setCurrentValue,
        handleSave: save,
        handleKeyDown,
      }) =>
        isEditing ? (
          <Input
            ref={inputRef}
            type="number"
            value={currentValue as string | number}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            min={min}
            max={max}
            step={step}
            className="h-7 px-2 font-mono text-sm tabular-nums"
          />
        ) : (
          <EditableCellDisplay
            onClick={() => {
              setIsEditing(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            disabled={disabled}
          >
            {value !== null && value !== undefined ? (
              <span className="font-mono text-sm tabular-nums">
                {formatDisplay(value)}
                {suffix && ` ${suffix}`}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </EditableCellDisplay>
        )
      }
    </EditableCell>
  )
}
