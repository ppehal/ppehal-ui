"use client"

import * as React from "react"
import { Input } from "@/registry/default/ui/input"
import { EditableCell, EditableCellDisplay } from "./editable-cell"

interface EditableTextCellProps {
  /** Current value */
  value: string | null | undefined
  /** Callback when value should be saved */
  onSave: (value: string | null) => Promise<void>
  /** Whether the cell is currently saving */
  isSaving?: boolean
  /** Error message */
  error?: string | null
  /** Placeholder for empty values */
  placeholder?: string
  /** Whether editing is disabled */
  disabled?: boolean
  /** Custom render function for display value */
  renderValue?: (value: string | null | undefined) => React.ReactNode
}

/**
 * Editable text cell component
 * Click to edit, Enter/blur to save, Escape to cancel
 */
export function EditableTextCell({
  value,
  onSave,
  isSaving,
  error,
  placeholder = "—",
  disabled,
  renderValue,
}: EditableTextCellProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSave = async (newValue: unknown) => {
    const strValue = newValue as string
    await onSave(strValue.trim() || null)
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
            type="text"
            value={(currentValue as string) ?? ""}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="h-7 px-2 text-sm"
          />
        ) : (
          <EditableCellDisplay
            onClick={() => {
              setIsEditing(true)
              // Focus input after render
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            disabled={disabled}
          >
            {renderValue ? (
              renderValue(value)
            ) : value ? (
              <span className="text-sm">{value}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </EditableCellDisplay>
        )
      }
    </EditableCell>
  )
}
