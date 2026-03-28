"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/registry/default/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/default/ui/popover"
import { Badge } from "@/registry/default/ui/badge"
import { useInactiveToggle } from "@/registry/default/hooks/use-inactive-toggle"

export interface ComboboxOption {
  value: string | number
  label: string
  description?: string
  is_active?: boolean
}

interface EditableComboboxCellProps {
  /** Current value (ID) */
  value: string | number | null | undefined
  /** Display value for the current selection */
  displayValue?: string | null
  /** Callback when value should be saved */
  onSave: (value: string | number | null) => Promise<void>
  /** Options to display (can be loaded async) */
  options: ComboboxOption[]
  /** Whether options are loading */
  isLoadingOptions?: boolean
  /** Callback to load/refresh options */
  onLoadOptions?: () => void
  /** Whether the cell is currently saving */
  isSaving?: boolean
  /** Error message */
  error?: string | null
  /** Placeholder for empty values */
  placeholder?: string
  /** Placeholder for search input */
  searchPlaceholder?: string
  /** Empty state message */
  emptyMessage?: string
  /** Whether editing is disabled */
  disabled?: boolean
  /** Width of the popover */
  popoverWidth?: number
  /** Allow clearing the selection */
  allowClear?: boolean
  /** Custom render for display value */
  renderDisplayValue?: (option: ComboboxOption | undefined) => React.ReactNode
  /** Enable inactive toggle (shows "Zobrazit neaktivní" option) */
  showInactiveToggle?: boolean
  /** localStorage key for persisting inactive toggle state */
  inactiveStorageKey?: string
}

/**
 * Editable combobox cell component for FK relationships
 * Double-click to open popover with searchable options
 */
export function EditableComboboxCell({
  value,
  displayValue,
  onSave,
  options,
  isLoadingOptions,
  onLoadOptions,
  isSaving,
  error,
  placeholder = "—",
  searchPlaceholder = "Hledat...",
  emptyMessage = "Nenalezeno.",
  disabled,
  popoverWidth = 300,
  allowClear = true,
  renderDisplayValue,
  showInactiveToggle = false,
  inactiveStorageKey = "combobox_show_inactive",
}: EditableComboboxCellProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [isHovered, setIsHovered] = React.useState(false)
  const { showInactive, toggle } = useInactiveToggle(inactiveStorageKey)

  // Find the selected option (compare as strings to handle number/string mismatch)
  const selectedOption = React.useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  )

  // Count inactive options
  const inactiveCount = React.useMemo(() => {
    return options.filter((opt) => opt.is_active === false).length
  }, [options])

  // Filter options based on inactive toggle
  // EDGE CASE: Always show selected value even if inactive
  const activeFilteredOptions = React.useMemo(() => {
    if (!showInactiveToggle || showInactive) {
      return options
    }
    return options.filter((opt) => opt.is_active !== false || String(opt.value) === String(value))
  }, [options, showInactive, showInactiveToggle, value])

  // Filter options by search
  const filteredOptions = React.useMemo(() => {
    if (!search) return activeFilteredOptions
    const searchLower = search.toLowerCase()
    return activeFilteredOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower)
    )
  }, [activeFilteredOptions, search])

  // Load options when opening
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && onLoadOptions) {
      onLoadOptions()
    }
    if (!newOpen) {
      setSearch("")
    }
  }

  const handleSelect = async (selectedValue: string | number) => {
    setOpen(false)
    setSearch("")

    // If same value, do nothing (unless allowClear and user wants to clear)
    if (String(selectedValue) === String(value)) {
      if (allowClear) {
        await onSave(null)
      }
      return
    }

    await onSave(selectedValue)
  }

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (value !== null && value !== undefined) {
      await onSave(null)
    }
  }

  // Should show toggle? Only if there are inactive items and toggle is enabled
  const shouldShowToggle = showInactiveToggle && inactiveCount > 0

  // Render display value
  const displayContent = React.useMemo(() => {
    // If custom renderer provided, use it but pass displayValue as fallback context
    if (renderDisplayValue) {
      // If we have a selected option, use it; otherwise create a fallback option from displayValue
      const optionToRender =
        selectedOption ?? (displayValue ? { value: value ?? "", label: displayValue } : undefined)
      return renderDisplayValue(optionToRender)
    }
    if (displayValue) {
      return <span className="truncate text-sm">{displayValue}</span>
    }
    if (selectedOption) {
      return <span className="truncate text-sm">{selectedOption.label}</span>
    }
    return <span className="text-muted-foreground text-sm">{placeholder}</span>
  }, [renderDisplayValue, selectedOption, displayValue, placeholder, value])

  return (
    <div className={cn("relative", isSaving && "pointer-events-none opacity-50")}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !disabled && setOpen(true)}
            className={cn(
              "-mx-1 flex min-h-[28px] items-center gap-1 rounded px-1 py-0.5 transition-colors",
              // Editable styling - hover effect only
              !disabled && "hover:bg-muted/50 cursor-pointer",
              disabled && "cursor-default",
              error && "text-destructive"
            )}
          >
            {displayContent}
            {/* Chevron icon on hover */}
            {isHovered && !disabled && (
              <ChevronsUpDown className="text-muted-foreground ml-auto h-3.5 w-3.5 shrink-0" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0" style={{ width: popoverWidth }} align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoadingOptions ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>

                  {/* Inactive toggle */}
                  {shouldShowToggle && (
                    <>
                      <CommandGroup>
                        <CommandItem onSelect={() => toggle()} className="justify-between">
                          <span className="flex items-center gap-2">
                            {showInactive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            {showInactive ? "Skrýt neaktivní" : "Zobrazit neaktivní"}
                          </span>
                          <Badge variant="secondary" className="ml-2">
                            {inactiveCount}
                          </Badge>
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  <CommandGroup>
                    {allowClear && value !== null && value !== undefined && (
                      <CommandItem
                        value="__clear__"
                        onSelect={() =>
                          handleClear({ stopPropagation: () => {} } as React.MouseEvent)
                        }
                        className="text-muted-foreground"
                      >
                        <span className="italic">Vymazat výběr</span>
                      </CommandItem>
                    )}
                    {filteredOptions.map((option) => {
                      const isInactive = option.is_active === false
                      return (
                        <CommandItem
                          key={option.value}
                          value={String(option.value)}
                          onSelect={() => handleSelect(option.value)}
                          className={cn(isInactive && "text-muted-foreground")}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate">{option.label}</span>
                            {option.description && (
                              <span className="text-muted-foreground truncate text-xs">
                                {option.description}
                              </span>
                            )}
                          </div>
                          {isInactive && (
                            <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                              neaktivní
                            </Badge>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <span className="text-destructive absolute -bottom-4 left-0 text-xs">{error}</span>}
    </div>
  )
}
