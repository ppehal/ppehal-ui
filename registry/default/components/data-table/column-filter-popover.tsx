"use client"

import * as React from "react"
import { Check } from "lucide-react"
import type { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import { Checkbox } from "@/registry/default/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/registry/default/ui/command"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Separator } from "@/registry/default/ui/separator"
import type { ColumnDataType, FilterOption } from "@/registry/default/lib/table-types"
import type {
  TextFilterValue,
  TextFilterOperator,
  NumberFilterValue,
  NumberFilterOperator,
  DateFilterValue,
  DateFilterOperator,
  DateFilterPreset,
  EnumFilterValue,
  BooleanFilterValue,
  FKFilterValue,
} from "@/registry/default/lib/filter-types"
import { FKColumnFilter } from "./fk-column-filter"
import {
  TEXT_OPERATOR_LABELS,
  NUMBER_OPERATOR_LABELS,
  DATE_OPERATOR_LABELS,
  DATE_PRESET_LABELS,
} from "@/registry/default/lib/filter-types"

interface ColumnFilterPopoverProps<TData> {
  column: Column<TData, unknown>
  columnType?: ColumnDataType
  filterOptions?: FilterOption[]
  onClose?: () => void
}

export function ColumnFilterPopover<TData>({
  column,
  columnType,
  filterOptions,
  onClose,
}: ColumnFilterPopoverProps<TData>) {
  const filterValue = column.getFilterValue()
  const title = column.columnDef.meta?.title ?? column.id

  const handleClear = () => {
    column.setFilterValue(undefined)
    setTimeout(() => onClose?.(), 0)
  }

  // Render appropriate filter based on column type
  switch (columnType) {
    case "text":
    case "code":
    case "email":
    case "phone":
      return (
        <TextColumnFilter
          title={title}
          value={filterValue as TextFilterValue | undefined}
          onChange={(v) => column.setFilterValue(v)}
          onClear={handleClear}
          onClose={onClose}
        />
      )
    case "number":
    case "currency":
    case "percentage":
      return (
        <NumberColumnFilter
          title={title}
          value={filterValue as NumberFilterValue | undefined}
          onChange={(v) => column.setFilterValue(v)}
          onClear={handleClear}
          onClose={onClose}
          isCurrency={columnType === "currency"}
          isPercentage={columnType === "percentage"}
        />
      )
    case "date":
    case "datetime":
      return (
        <DateColumnFilter
          title={title}
          value={filterValue as DateFilterValue | undefined}
          onChange={(v) => column.setFilterValue(v)}
          onClear={handleClear}
          onClose={onClose}
        />
      )
    case "enum":
      return (
        <EnumColumnFilter
          title={title}
          value={filterValue as EnumFilterValue | undefined}
          onChange={(v) => column.setFilterValue(v)}
          onClear={handleClear}
          onClose={onClose}
          options={filterOptions ?? []}
        />
      )
    case "boolean":
      return (
        <BooleanColumnFilter
          title={title}
          value={filterValue as BooleanFilterValue | undefined}
          onChange={(v) => column.setFilterValue(v)}
          onClear={handleClear}
          onClose={onClose}
        />
      )
    case "fk":
      return (
        <FKColumnFilter
          title={title}
          value={filterValue as FKFilterValue | undefined}
          onChange={(v) => column.setFilterValue(v)}
          onClear={handleClear}
          onClose={onClose}
          optionsLoader={column.columnDef.meta?.fkOptionsLoader ?? (() => Promise.resolve([]))}
        />
      )
    default:
      // Default to text filter
      return (
        <TextColumnFilter
          title={title}
          value={filterValue as TextFilterValue | undefined}
          onChange={(v) => column.setFilterValue(v)}
          onClear={handleClear}
          onClose={onClose}
        />
      )
  }
}

// =============================================================================
// Text Column Filter
// =============================================================================

interface TextColumnFilterProps {
  title: string
  value?: TextFilterValue
  onChange: (value: TextFilterValue | undefined) => void
  onClear: () => void
  onClose?: () => void
}

function TextColumnFilter({ title, value, onChange, onClear, onClose }: TextColumnFilterProps) {
  const [operator, setOperator] = React.useState<TextFilterOperator>(value?.operator ?? "contains")
  const [inputValue, setInputValue] = React.useState(value?.value ?? "")

  React.useEffect(() => {
    setOperator(value?.operator ?? "contains")
    setInputValue(value?.value ?? "")
  }, [value])

  const handleApply = () => {
    if (operator === "isEmpty" || operator === "isNotEmpty") {
      onChange({ operator, value: "" })
    } else if (inputValue.trim()) {
      onChange({ operator, value: inputValue.trim() })
    } else {
      onChange(undefined)
    }
    // Defer close to allow filter state update to complete
    setTimeout(() => onClose?.(), 0)
  }

  const showValueInput = operator !== "isEmpty" && operator !== "isNotEmpty"

  return (
    <div className="w-[280px] p-4">
      <p className="mb-3 text-sm font-medium">Filtr: {title}</p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Operátor</Label>
          <Select value={operator} onValueChange={(v) => setOperator(v as TextFilterOperator)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEXT_OPERATOR_LABELS).map(([op, label]) => (
                <SelectItem key={op} value={op}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showValueInput && (
          <div className="space-y-1.5">
            <Label className="text-xs">Hodnota</Label>
            <Input
              className="h-8"
              placeholder="Zadejte text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
            />
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Vymazat
          </Button>
          <Button size="sm" onClick={handleApply}>
            Použít
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Number Column Filter
// =============================================================================

// Format number string with thousand separators (Czech style: "3 000 000")
function formatNumberWithSpaces(value: string): string {
  // Remove existing spaces
  const cleaned = value.replace(/\s/g, "")

  // Handle empty or just minus sign
  if (!cleaned || cleaned === "-") return cleaned

  // Split into integer and decimal parts
  const parts = cleaned.split(/[,.]/)
  const integerPart = parts[0]
  const decimalPart = parts[1]
  const hasDecimalSeparator = cleaned.includes(",") || cleaned.includes(".")

  // Format integer part with spaces (from right to left)
  const sign = integerPart.startsWith("-") ? "-" : ""
  const digits = integerPart.replace("-", "")
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ")

  // Reconstruct with decimal part if present
  if (hasDecimalSeparator) {
    return sign + formatted + "," + (decimalPart ?? "")
  }
  return sign + formatted
}

// Parse formatted number to raw numeric string
function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(",", ".")
  return parseFloat(cleaned)
}

// Validate and format number input
function handleNumberInputChange(newValue: string, setValue: (v: string) => void): void {
  // Allow empty
  if (!newValue) {
    setValue("")
    return
  }

  // Remove spaces first (user might paste formatted number)
  const withoutSpaces = newValue.replace(/\s/g, "")

  // Validate: only digits, one minus at start, one decimal separator (comma or dot)
  // Pattern: optional minus, digits, optional decimal part
  const isValid = /^-?\d*[,.]?\d*$/.test(withoutSpaces)

  if (isValid) {
    // Format and set
    setValue(formatNumberWithSpaces(withoutSpaces))
  }
  // If invalid, ignore the input (don't update state)
}

// Format initial value from number to formatted string
function formatInitialValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return ""
  // Convert to string, replace dot with comma for Czech locale
  const str = value.toString().replace(".", ",")
  return formatNumberWithSpaces(str)
}

interface NumberColumnFilterProps {
  title: string
  value?: NumberFilterValue
  onChange: (value: NumberFilterValue | undefined) => void
  onClear: () => void
  onClose?: () => void
  isCurrency?: boolean
  isPercentage?: boolean
}

function NumberColumnFilter({
  title,
  value,
  onChange,
  onClear,
  onClose,
  isCurrency,
  isPercentage,
}: NumberColumnFilterProps) {
  const [operator, setOperator] = React.useState<NumberFilterOperator>(value?.operator ?? "gte")
  const [inputValue, setInputValue] = React.useState(() => formatInitialValue(value?.value))
  const [inputValueTo, setInputValueTo] = React.useState(() => formatInitialValue(value?.valueTo))

  React.useEffect(() => {
    setOperator(value?.operator ?? "gte")
    setInputValue(formatInitialValue(value?.value))
    setInputValueTo(formatInitialValue(value?.valueTo))
  }, [value])

  const handleApply = () => {
    if (operator === "isEmpty" || operator === "isNotEmpty") {
      onChange({ operator, value: null })
      setTimeout(() => onClose?.(), 0)
      return
    }

    const numValue = parseFormattedNumber(inputValue)
    if (isNaN(numValue)) {
      onChange(undefined)
      setTimeout(() => onClose?.(), 0)
      return
    }

    const filter: NumberFilterValue = {
      operator,
      value: numValue,
    }

    if (operator === "between") {
      const numValueTo = parseFormattedNumber(inputValueTo)
      if (!isNaN(numValueTo)) {
        filter.valueTo = numValueTo
      }
    }

    onChange(filter)
    setTimeout(() => onClose?.(), 0)
  }

  const showValueInput = operator !== "isEmpty" && operator !== "isNotEmpty"
  const placeholder = isCurrency ? "0 Kč" : isPercentage ? "0 %" : "0"

  return (
    <div className="w-[280px] p-4">
      <p className="mb-3 text-sm font-medium">Filtr: {title}</p>

      {/* Quick null/empty buttons */}
      <div className="mb-3 flex gap-2">
        <Button
          variant={operator === "isEmpty" ? "secondary" : "outline"}
          size="sm"
          className="flex-1 text-xs"
          onClick={() => {
            setOperator("isEmpty")
            onChange({ operator: "isEmpty", value: null })
            setTimeout(() => onClose?.(), 0)
          }}
        >
          Je prázdné
        </Button>
        <Button
          variant={operator === "isNotEmpty" ? "secondary" : "outline"}
          size="sm"
          className="flex-1 text-xs"
          onClick={() => {
            setOperator("isNotEmpty")
            onChange({ operator: "isNotEmpty", value: null })
            setTimeout(() => onClose?.(), 0)
          }}
        >
          Není prázdné
        </Button>
      </div>
      <Separator className="mb-3" />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Operátor</Label>
          <Select value={operator} onValueChange={(v) => setOperator(v as NumberFilterOperator)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(NUMBER_OPERATOR_LABELS).map(([op, label]) => (
                <SelectItem key={op} value={op}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showValueInput && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">{operator === "between" ? "Od" : "Hodnota"}</Label>
              <Input
                className="h-8 tabular-nums"
                type="text"
                inputMode="decimal"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => handleNumberInputChange(e.target.value, setInputValue)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
              />
            </div>

            {operator === "between" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Do</Label>
                <Input
                  className="h-8 tabular-nums"
                  type="text"
                  inputMode="decimal"
                  placeholder={placeholder}
                  value={inputValueTo}
                  onChange={(e) => handleNumberInputChange(e.target.value, setInputValueTo)}
                  onKeyDown={(e) => e.key === "Enter" && handleApply()}
                />
              </div>
            )}
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Vymazat
          </Button>
          <Button size="sm" onClick={handleApply}>
            Použít
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Date Column Filter
// =============================================================================

interface DateColumnFilterProps {
  title: string
  value?: DateFilterValue
  onChange: (value: DateFilterValue | undefined) => void
  onClear: () => void
  onClose?: () => void
}

function DateColumnFilter({ title, value, onChange, onClear, onClose }: DateColumnFilterProps) {
  const [operator, setOperator] = React.useState<DateFilterOperator>(value?.operator ?? "between")
  const [preset, setPreset] = React.useState<DateFilterPreset | undefined>(value?.preset)
  const [fromDate, setFromDate] = React.useState<string>(
    value?.from ? formatDateForInput(new Date(value.from)) : ""
  )
  const [toDate, setToDate] = React.useState<string>(
    value?.to ? formatDateForInput(new Date(value.to)) : ""
  )

  React.useEffect(() => {
    if (value?.preset) {
      setPreset(value.preset)
      setFromDate("")
      setToDate("")
    } else if (value?.operator) {
      setOperator(value.operator)
      setFromDate(value.from ? formatDateForInput(new Date(value.from)) : "")
      setToDate(value.to ? formatDateForInput(new Date(value.to)) : "")
      setPreset(undefined)
    } else if (value?.from || value?.to) {
      setFromDate(value.from ? formatDateForInput(new Date(value.from)) : "")
      setToDate(value.to ? formatDateForInput(new Date(value.to)) : "")
      setPreset(undefined)
    }
  }, [value])

  const handlePresetClick = (p: DateFilterPreset) => {
    setPreset(p)
    setFromDate("")
    setToDate("")
    onChange({ preset: p })
    setTimeout(() => onClose?.(), 0)
  }

  const handleApply = () => {
    if (operator === "isEmpty" || operator === "isNotEmpty") {
      onChange({ operator })
      setTimeout(() => onClose?.(), 0)
      return
    }

    if (preset) {
      onChange({ preset })
    } else if (fromDate || toDate) {
      onChange({
        operator,
        from: fromDate ? new Date(fromDate) : undefined,
        to: toDate ? new Date(toDate) : undefined,
      })
    } else {
      onChange(undefined)
    }
    setTimeout(() => onClose?.(), 0)
  }

  const showDateInputs = operator !== "isEmpty" && operator !== "isNotEmpty"

  return (
    <div className="w-[320px] p-4">
      <p className="mb-3 text-sm font-medium">Filtr: {title}</p>

      <div className="flex gap-4">
        {/* Presets column */}
        <div className="space-y-1 border-r pr-4">
          <p className="text-muted-foreground mb-2 text-xs font-medium">Rychlý výběr</p>
          {/* Null/empty filters at the top for visibility */}
          <Button
            variant={operator === "isEmpty" && !preset ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => {
              setOperator("isEmpty")
              setPreset(undefined)
              onChange({ operator: "isEmpty" })
              setTimeout(() => onClose?.(), 0)
            }}
          >
            Je prázdné
          </Button>
          <Button
            variant={operator === "isNotEmpty" && !preset ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => {
              setOperator("isNotEmpty")
              setPreset(undefined)
              onChange({ operator: "isNotEmpty" })
              setTimeout(() => onClose?.(), 0)
            }}
          >
            Není prázdné
          </Button>
          <Separator className="my-2" />
          {/* Date presets */}
          {Object.entries(DATE_PRESET_LABELS).map(([p, label]) => (
            <Button
              key={p}
              variant={preset === p ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => handlePresetClick(p as DateFilterPreset)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Custom date selection */}
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Operátor</Label>
            <Select
              value={operator}
              onValueChange={(v) => {
                setOperator(v as DateFilterOperator)
                setPreset(undefined)
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATE_OPERATOR_LABELS).map(([op, label]) => (
                  <SelectItem key={op} value={op}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showDateInputs && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {operator === "between"
                    ? "Od"
                    : operator === "before"
                      ? "Před"
                      : operator === "after"
                        ? "Po"
                        : "Datum"}
                </Label>
                <Input
                  type="date"
                  className="h-8"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    setPreset(undefined)
                  }}
                />
              </div>

              {operator === "between" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Do</Label>
                  <Input
                    type="date"
                    className="h-8"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value)
                      setPreset(undefined)
                    }}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={onClear}>
              Vymazat
            </Button>
            <Button size="sm" onClick={handleApply}>
              Použít
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to format Date to YYYY-MM-DD string for input[type="date"]
function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0]
}

// =============================================================================
// Enum Column Filter
// =============================================================================

interface EnumColumnFilterProps {
  title: string
  value?: EnumFilterValue
  onChange: (value: EnumFilterValue | undefined) => void
  onClear: () => void
  onClose?: () => void
  options: FilterOption[]
}

function EnumColumnFilter({
  title,
  value,
  onChange,
  onClear,
  onClose,
  options,
}: EnumColumnFilterProps) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value ?? [])

  React.useEffect(() => {
    setSelectedValues(value ?? [])
  }, [value])

  // Group options by group property (if present)
  const groupedOptions = React.useMemo(() => {
    const hasGroups = options.some((o) => o.group)
    if (!hasGroups) return null

    const groups = new Map<string, FilterOption[]>()
    for (const option of options) {
      const groupName = option.group ?? ""
      if (!groups.has(groupName)) {
        groups.set(groupName, [])
      }
      groups.get(groupName)!.push(option)
    }
    return groups
  }, [options])

  const handleToggle = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue]
    setSelectedValues(newValues)
  }

  const handleToggleGroup = React.useCallback(
    (groupOptions: FilterOption[]) => {
      const groupValues = groupOptions.map((o) => o.value)
      const allSelected = groupValues.every((v) => selectedValues.includes(v))
      if (allSelected) {
        setSelectedValues(selectedValues.filter((v) => !groupValues.includes(v)))
      } else {
        const newValues = new Set(selectedValues)
        groupValues.forEach((v) => newValues.add(v))
        setSelectedValues(Array.from(newValues))
      }
    },
    [selectedValues]
  )

  const handleSelectAll = () => {
    setSelectedValues(options.map((o) => o.value))
  }

  const handleSelectNone = () => {
    setSelectedValues([])
  }

  const handleApply = () => {
    onChange(selectedValues.length > 0 ? selectedValues : undefined)
    setTimeout(() => onClose?.(), 0)
  }

  const isGroupFullySelected = (groupOptions: FilterOption[]) =>
    groupOptions.every((o) => selectedValues.includes(o.value))

  const isGroupPartiallySelected = (groupOptions: FilterOption[]) =>
    groupOptions.some((o) => selectedValues.includes(o.value)) &&
    !groupOptions.every((o) => selectedValues.includes(o.value))

  return (
    <div className="w-[280px] p-4">
      <p className="mb-3 text-sm font-medium">Filtr: {title}</p>

      <div className="mb-2 flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSelectAll}>
          Vše
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSelectNone}>
          Nic
        </Button>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {selectedValues.length}/{options.length}
        </span>
      </div>

      <Command className="rounded-md border">
        <CommandInput placeholder="Hledat..." className="h-8" />
        <CommandList>
          <CommandEmpty>Nic nenalezeno</CommandEmpty>
          {groupedOptions ? (
            // Grouped display
            <ScrollArea className="h-[240px]">
              {Array.from(groupedOptions.entries()).map(([groupName, groupOptions]) => {
                const fullySelected = isGroupFullySelected(groupOptions)
                const partiallySelected = isGroupPartiallySelected(groupOptions)
                return (
                  <CommandGroup key={groupName || "ungrouped"}>
                    {groupName && (
                      <CommandItem
                        value={`group-${groupName} ${groupName}`}
                        onSelect={() => handleToggleGroup(groupOptions)}
                        className="font-medium"
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                            fullySelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : partiallySelected
                                ? "bg-primary/50 border-primary"
                                : "border-muted-foreground"
                          )}
                        >
                          {fullySelected && <Check className="h-3 w-3" />}
                          {partiallySelected && (
                            <div className="bg-primary-foreground h-1.5 w-1.5 rounded-full" />
                          )}
                        </div>
                        <span>{groupName}</span>
                        <span className="text-muted-foreground ml-auto text-xs">
                          {groupOptions.length}
                        </span>
                      </CommandItem>
                    )}
                    {groupOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={`${option.value} ${option.label}`}
                        onSelect={() => handleToggle(option.value)}
                        className={cn(groupName && "pl-8")}
                      >
                        <Checkbox
                          checked={selectedValues.includes(option.value)}
                          className="mr-2"
                        />
                        <span className="flex-1">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-muted-foreground text-xs">({option.count})</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
            </ScrollArea>
          ) : (
            // Flat display (original)
            <CommandGroup>
              <ScrollArea className="h-[200px]">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.value} ${option.label}`}
                    onSelect={() => handleToggle(option.value)}
                  >
                    <Checkbox checked={selectedValues.includes(option.value)} className="mr-2" />
                    <span className="flex-1">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-muted-foreground text-xs">({option.count})</span>
                    )}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          )}
        </CommandList>
      </Command>

      <div className="flex justify-between pt-3">
        <Button variant="ghost" size="sm" onClick={onClear}>
          Vymazat
        </Button>
        <Button size="sm" onClick={handleApply}>
          Použít
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Boolean Column Filter
// =============================================================================

interface BooleanColumnFilterProps {
  title: string
  value?: BooleanFilterValue
  onChange: (value: BooleanFilterValue | undefined) => void
  onClear: () => void
  onClose?: () => void
}

function BooleanColumnFilter({
  title,
  value,
  onChange,
  onClear,
  onClose,
}: BooleanColumnFilterProps) {
  const [selectedValue, setSelectedValue] = React.useState<boolean | null>(value ?? null)

  React.useEffect(() => {
    setSelectedValue(value ?? null)
  }, [value])

  const handleApply = () => {
    onChange(selectedValue)
    setTimeout(() => onClose?.(), 0)
  }

  return (
    <div className="w-[200px] p-4">
      <p className="mb-3 text-sm font-medium">Filtr: {title}</p>

      <div className="space-y-2">
        <Button
          variant={selectedValue === true ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start"
          onClick={() => setSelectedValue(true)}
        >
          <Check
            className={cn("mr-2 h-4 w-4", selectedValue === true ? "opacity-100" : "opacity-0")}
          />
          Ano
        </Button>
        <Button
          variant={selectedValue === false ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start"
          onClick={() => setSelectedValue(false)}
        >
          <Check
            className={cn("mr-2 h-4 w-4", selectedValue === false ? "opacity-100" : "opacity-0")}
          />
          Ne
        </Button>
      </div>

      <div className="flex justify-between pt-3">
        <Button variant="ghost" size="sm" onClick={onClear}>
          Vymazat
        </Button>
        <Button size="sm" onClick={handleApply}>
          Použít
        </Button>
      </div>
    </div>
  )
}
