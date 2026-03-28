"use client"

import * as React from "react"
import { Input } from "@/registry/default/ui/input"
import { EditableCell, EditableCellDisplay } from "./editable-cell"

interface EditableCurrencyCellProps {
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
  /** Currency code (default: CZK) */
  currency?: string
  /** Locale for formatting (default: cs-CZ) */
  locale?: string
  /** Additional class for display value (e.g. color) */
  className?: string
}

/**
 * Editable currency cell component
 * Double-click to edit, Enter/blur to save, Escape to cancel
 * Displays formatted currency, edits as plain number
 */
export function EditableCurrencyCell({
  value,
  onSave,
  isSaving,
  error,
  placeholder = "—",
  disabled,
  currency = "CZK",
  locale = "cs-CZ",
  className,
}: EditableCurrencyCellProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSave = async (newValue: unknown) => {
    const strValue = String(newValue ?? "").trim()
    if (strValue === "") {
      await onSave(null)
      return
    }
    // Remove spaces and replace comma with dot
    const cleanValue = strValue.replace(/\s/g, "").replace(",", ".")
    const numValue = parseFloat(cleanValue)
    if (isNaN(numValue)) {
      await onSave(null)
      return
    }
    await onSave(numValue)
  }

  const formatCurrency = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return ""
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Format number with spaces: 1234567 -> "1 234 567"
  const formatWithSpaces = (val: string | number): string => {
    const str = String(val).replace(/\s/g, "").replace(",", ".")
    const num = parseFloat(str)
    if (isNaN(num)) return String(val)
    // Format with narrow non-breaking spaces (Czech locale uses these)
    return new Intl.NumberFormat("cs-CZ", {
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(num)
  }

  // Handle input change with live formatting
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setCurrentValue: (val: unknown) => void
  ) => {
    const rawValue = e.target.value
    // Allow empty or just typing
    if (rawValue === "" || rawValue === "-") {
      setCurrentValue(rawValue)
      return
    }
    // Remove all spaces and format again
    const cleanValue = rawValue.replace(/\s/g, "").replace(",", ".")
    // If it's a valid number or partial number, format it
    if (/^-?\d*\.?\d*$/.test(cleanValue)) {
      // Keep cursor position logic
      const formatted = cleanValue ? formatWithSpaces(cleanValue) : ""
      setCurrentValue(formatted)
    }
  }

  return (
    <EditableCell
      value={value !== null && value !== undefined ? formatWithSpaces(value) : ""}
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
            type="text"
            inputMode="decimal"
            value={currentValue as string | number}
            onChange={(e) => handleInputChange(e, setCurrentValue)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
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
              <span className={`font-mono text-sm tabular-nums ${className ?? ""}`}>
                {formatCurrency(value)}
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
