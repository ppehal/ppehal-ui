"use client"

import * as React from "react"
import { Check, Search } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import { Checkbox } from "@/registry/default/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/default/ui/tabs"
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
import { Skeleton } from "@/registry/default/ui/skeleton"
import { Separator } from "@/registry/default/ui/separator"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import type { FilterOption } from "@/registry/default/lib/table-types"
import type { FKFilterValue, TextFilterOperator } from "@/registry/default/lib/filter-types"
import { TEXT_OPERATOR_LABELS } from "@/registry/default/lib/filter-types"

interface FKColumnFilterProps {
  title: string
  value?: FKFilterValue
  onChange: (value: FKFilterValue | undefined) => void
  onClear: () => void
  onClose?: () => void
  optionsLoader: () => Promise<FilterOption[]>
}

export function FKColumnFilter({
  title,
  value,
  onChange,
  onClear,
  onClose,
  optionsLoader,
}: FKColumnFilterProps) {
  // Determine initial tab based on current value
  const initialTab = value?.selectedIds?.length ? "select" : "search"

  // State
  const [activeTab, setActiveTab] = React.useState<"search" | "select">(initialTab)

  // Text search state
  const [operator, setOperator] = React.useState<TextFilterOperator>(
    value?.textSearch?.operator ?? "contains"
  )
  const [searchText, setSearchText] = React.useState(value?.textSearch?.value ?? "")

  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<(number | null)[]>(value?.selectedIds ?? [])
  const [options, setOptions] = React.useState<FilterOption[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [optionSearch, setOptionSearch] = React.useState("")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nullCount, setNullCount] = React.useState<number | undefined>(undefined)

  // Load options when switching to select tab
  React.useEffect(() => {
    if (activeTab === "select" && options.length === 0) {
      setIsLoading(true)
      optionsLoader()
        .then((opts) => {
          setOptions(opts)
          // Calculate null count (total - sum of all counts)
          // This is an approximation - ideally the server would provide this
        })
        .finally(() => setIsLoading(false))
    }
  }, [activeTab, options.length, optionsLoader])

  // Sync state when value prop changes
  React.useEffect(() => {
    if (value?.textSearch) {
      setOperator(value.textSearch.operator)
      setSearchText(value.textSearch.value)
    }
    if (value?.selectedIds) {
      setSelectedIds(value.selectedIds)
    }
  }, [value])

  // Clear state when switching tabs (exclusive mode)
  const handleTabChange = (newTab: string) => {
    if (newTab === "search") {
      setSelectedIds([])
    } else {
      setSearchText("")
      setOperator("contains")
    }
    setActiveTab(newTab as "search" | "select")
  }

  // Filter options by search
  const filteredOptions = React.useMemo(() => {
    if (!optionSearch) return options
    const search = optionSearch.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(search))
  }, [options, optionSearch])

  const handleToggleId = (id: number | null) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSelectAll = () => {
    // Select all visible options + null if filtered shows it
    const allIds: (number | null)[] = filteredOptions.map((o) => Number(o.value))
    // Include null only if search is empty (shows all)
    if (!optionSearch) {
      allIds.unshift(null)
    }
    setSelectedIds(allIds)
  }

  const handleSelectNone = () => {
    setSelectedIds([])
  }

  const handleApply = () => {
    if (activeTab === "search") {
      // Text search mode
      if (operator === "isEmpty" || operator === "isNotEmpty") {
        onChange({ textSearch: { operator, value: "" } })
      } else if (searchText.trim()) {
        onChange({ textSearch: { operator, value: searchText.trim() } })
      } else {
        onChange(undefined)
      }
    } else {
      // Selection mode
      if (selectedIds.length > 0) {
        onChange({ selectedIds })
      } else {
        onChange(undefined)
      }
    }
    setTimeout(() => onClose?.(), 0)
  }

  const showValueInput = operator !== "isEmpty" && operator !== "isNotEmpty"

  // Total count for selection (options + 1 for null)
  const totalCount = options.length + 1

  return (
    <div className="w-[320px] p-4">
      <p className="mb-3 text-sm font-medium">Filtr: {title}</p>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-3 grid w-full grid-cols-2">
          <TabsTrigger value="search" className="text-xs">
            <Search className="mr-1.5 h-3 w-3" />
            Hledat text
          </TabsTrigger>
          <TabsTrigger value="select" className="text-xs">
            <Check className="mr-1.5 h-3 w-3" />
            Vybrat
          </TabsTrigger>
        </TabsList>

        {/* Text Search Tab */}
        <TabsContent value="search" className="space-y-3">
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
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
              />
            </div>
          )}
        </TabsContent>

        {/* Selection Tab */}
        <TabsContent value="select" className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSelectAll}
                >
                  Vše
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSelectNone}
                >
                  Nic
                </Button>
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                  {selectedIds.length}/{totalCount}
                </span>
              </div>

              <Command className="rounded-md border">
                <CommandInput
                  placeholder="Hledat..."
                  className="h-8"
                  value={optionSearch}
                  onValueChange={setOptionSearch}
                />
                <CommandList>
                  <CommandEmpty>Nic nenalezeno</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      {/* Null option - "Bez přiřazení" */}
                      {!optionSearch && (
                        <>
                          <CommandItem
                            value="__null__"
                            onSelect={() => handleToggleId(null)}
                            className="text-muted-foreground"
                          >
                            <Checkbox checked={selectedIds.includes(null)} className="mr-2" />
                            <span className="flex-1 italic">Bez přiřazení</span>
                            {nullCount !== undefined && (
                              <span className="text-muted-foreground text-xs">({nullCount})</span>
                            )}
                          </CommandItem>
                          <Separator className="my-1" />
                        </>
                      )}

                      {/* Regular options */}
                      {filteredOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => handleToggleId(Number(option.value))}
                        >
                          <Checkbox
                            checked={selectedIds.includes(Number(option.value))}
                            className="mr-2"
                          />
                          <span className="flex-1 truncate">{option.label}</span>
                          {option.count !== undefined && (
                            <span className="text-muted-foreground text-xs">({option.count})</span>
                          )}
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </>
          )}
        </TabsContent>
      </Tabs>

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
