"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
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

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

interface EditableSelectWithSearchCellProps<T extends string> {
  /** Current value */
  value: T | null | undefined
  /** Callback when value should be saved */
  onSave: (value: T | null) => Promise<void>
  /** Available options */
  options: SelectOption<T>[]
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
  /** Allow clearing the selection */
  allowClear?: boolean
  /** Width of the popover */
  popoverWidth?: number
  /** Custom render function for display value */
  renderValue?: (value: T | null | undefined, option?: SelectOption<T>) => React.ReactNode
  /** Custom render function for options in dropdown */
  renderOption?: (option: SelectOption<T>) => React.ReactNode
}

/**
 * Editable select cell with search functionality
 * Combines Select-like UX with Command search capability
 * Best for enums with many options (>20)
 */
export function EditableSelectWithSearchCell<T extends string>({
  value,
  onSave,
  options,
  isSaving,
  error,
  placeholder = "—",
  searchPlaceholder = "Hledat...",
  emptyMessage = "Nenalezeno.",
  disabled,
  allowClear = true,
  popoverWidth = 240,
  renderValue,
  renderOption,
}: EditableSelectWithSearchCellProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [isHovered, setIsHovered] = React.useState(false)
  const [isSavingLocal, setIsSavingLocal] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const showLoading = isSaving || isSavingLocal

  // Find the selected option
  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  )

  // Filter options by search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(searchLower))
  }, [options, search])

  // Autofocus input when opening
  React.useEffect(() => {
    if (open) {
      // Small delay to ensure popover is mounted
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled || showLoading) return
    setOpen(newOpen)
    if (!newOpen) {
      setSearch("")
    }
  }

  const handleSelect = React.useCallback(
    async (selectedValue: T | null) => {
      if (isSavingLocal) return // Prevent double-submit

      // If same value, just close
      if (selectedValue === value) {
        setOpen(false)
        setSearch("")
        return
      }

      setIsSavingLocal(true)
      setLocalError(null)

      try {
        await onSave(selectedValue)
        setOpen(false)
        setSearch("")
      } catch (e) {
        console.error("[EditableSelectWithSearchCell]", e)
        setLocalError(e instanceof Error ? e.message : "Chyba při ukládání")
      } finally {
        setIsSavingLocal(false)
      }
    },
    [isSavingLocal, value, onSave]
  )

  const displayError = error || localError

  // Render display content
  const displayContent = React.useMemo(() => {
    if (renderValue) {
      return renderValue(value ?? null, selectedOption)
    }
    if (value && selectedOption) {
      return <span className="truncate text-sm">{selectedOption.label}</span>
    }
    return <span className="text-muted-foreground text-sm">{placeholder}</span>
  }, [renderValue, value, selectedOption, placeholder])

  return (
    <div className={cn("relative", showLoading && "pointer-events-none opacity-50")}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !disabled && !showLoading && setOpen(true)}
            className={cn(
              "-mx-1 flex min-h-[28px] items-center gap-1 rounded px-1 py-0.5 transition-colors",
              !disabled && "hover:bg-muted/50 cursor-pointer",
              disabled && "cursor-default",
              displayError && "text-destructive"
            )}
          >
            {displayContent}
            {isHovered && !disabled && !showLoading && (
              <ChevronsUpDown className="text-muted-foreground ml-auto h-3.5 w-3.5 shrink-0" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: popoverWidth, maxWidth: "calc(100vw - 16px)" }}
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="min-w-0 flex-1 truncate">
                      {renderOption ? renderOption(option) : option.label}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Clear button - separated from options */}
              {allowClear && value && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value="__clear__"
                      onSelect={() => handleSelect(null)}
                      className="text-muted-foreground"
                    >
                      <X className="mr-2 h-4 w-4" />
                      <span className="italic">Vymazat</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Loading overlay */}
      {showLoading && (
        <div className="bg-background/50 absolute inset-0 flex items-center justify-center rounded">
          <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <span className="text-destructive absolute -bottom-4 left-0 text-xs whitespace-nowrap">
          {displayError}
        </span>
      )}
    </div>
  )
}
