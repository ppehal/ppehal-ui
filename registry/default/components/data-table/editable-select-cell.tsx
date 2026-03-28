"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { EditableCellDisplay } from "./editable-cell"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectOption {
  value: string
  label: string
}

interface EditableSelectCellProps {
  /** Current value */
  value: string | null | undefined
  /** Callback when value should be saved */
  onSave: (value: string | null) => Promise<void>
  /** Available options */
  options: SelectOption[]
  /** Whether the cell is currently saving */
  isSaving?: boolean
  /** Error message */
  error?: string | null
  /** Placeholder for empty values */
  placeholder?: string
  /** Whether editing is disabled */
  disabled?: boolean
  /** Custom render function for display value */
  renderValue?: (value: string | null | undefined, option?: SelectOption) => React.ReactNode
  /** Custom render function for options in dropdown */
  renderOption?: (option: SelectOption) => React.ReactNode
}

/**
 * Editable select cell component
 * Double-click to open dropdown, selection auto-saves
 */
export function EditableSelectCell({
  value,
  onSave,
  options,
  isSaving,
  error,
  placeholder = "—",
  disabled,
  renderValue,
  renderOption,
}: EditableSelectCellProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)

  const currentOption = options.find((o) => o.value === value)

  const handleValueChange = async (newValue: string) => {
    if (disabled || isSaving) return
    if (newValue === value) {
      setIsEditing(false)
      return
    }

    setLocalError(null)
    try {
      await onSave(newValue || null)
      setIsEditing(false)
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Chyba při ukládání")
    }
  }

  const displayError = error || localError

  if (isEditing) {
    return (
      <div className={cn("relative", displayError && "ring-destructive rounded ring-1")}>
        <Select
          value={value ?? ""}
          onValueChange={handleValueChange}
          onOpenChange={(open) => {
            if (!open) setIsEditing(false)
          }}
          open={isEditing}
          disabled={disabled || isSaving}
        >
          <SelectTrigger className="h-7 text-sm" onClick={(e) => e.stopPropagation()}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {renderOption ? renderOption(option) : option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isSaving && (
          <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
          </div>
        )}
        {displayError && (
          <div className="text-destructive absolute -bottom-5 left-0 text-xs whitespace-nowrap">
            {displayError}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative", displayError && "ring-destructive rounded ring-1")}>
      <EditableCellDisplay onClick={() => setIsEditing(true)} disabled={disabled}>
        {renderValue ? (
          renderValue(value, currentOption)
        ) : value && currentOption ? (
          <span className="text-sm">{currentOption.label}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </EditableCellDisplay>
      {isSaving && (
        <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
          <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
        </div>
      )}
    </div>
  )
}
