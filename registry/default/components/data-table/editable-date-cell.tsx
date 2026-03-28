"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { cs } from "date-fns/locale"
import { AlertTriangle, CalendarIcon, Pencil, X } from "lucide-react"
import { Button } from "@/registry/default/ui/button"
import { Calendar } from "@/registry/default/ui/calendar"
import { Input } from "@/registry/default/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/default/ui/popover"
import { cn } from "@/lib/utils"
import { BASE_COLORS } from "@/lib/constants/color-schemes"

/**
 * Parse cesky format datumu (DD.MM.YYYY nebo D.M.YYYY)
 * Podporuje:
 * - 30.12.2025 (s uvodnima nulama)
 * - 1.1.2025 (bez uvodnich nul)
 * - 01.01.2025
 */
function parseCzechDate(input: string): Date | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Regex pro DD.MM.YYYY (1-2 cislice pro den a mesic, 4 pro rok)
  const czechDateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
  const match = trimmed.match(czechDateRegex)

  if (!match) return null

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)

  // Zakladni validace rozsahu
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  if (year < 1900 || year > 2100) return null

  // Vytvoreni data a validace (Date constructor "opravuje" neplatna data)
  const date = new Date(year, month - 1, day)

  // Kontrola ze Date nevytvoril jine datum (napr. 31.02 -> 03.03)
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null
  }

  return date
}

/**
 * Smart date parser - cesky format s ISO fallbackem
 * Priorita: cesky format > ISO format
 */
function parseDateSmart(input: string): Date | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // 1. Priorita: cesky format (DD.MM.YYYY)
  const czech = parseCzechDate(trimmed)
  if (czech) return czech

  // 2. Fallback: ISO format (YYYY-MM-DD) pro copy z databazi/Excelu
  // parseISO z date-fns je strikni a bezpecny
  const iso = parseISO(trimmed)
  if (isValid(iso)) return iso

  return null
}

interface EditableDateCellProps {
  /** Current value */
  value: Date | string | null | undefined
  /** Callback when value should be saved */
  onSave: (value: Date | null) => Promise<void>
  /** Whether the cell is currently saving */
  isSaving?: boolean
  /** Error message */
  error?: string | null
  /** Placeholder for empty values */
  placeholder?: string
  /** Whether editing is disabled */
  disabled?: boolean
  /** Date format string (default: "d. M. yyyy") */
  dateFormat?: string
  /** Whether to allow clearing the date */
  allowClear?: boolean
  /** Deadline warning indicator for expiring/expired dates */
  deadlineWarning?: {
    isExpired: boolean
    isExpiringSoon: boolean
  }
}

/**
 * Editable date cell component
 * Click to open calendar popover, select date or type to save
 */
export function EditableDateCell({
  value,
  onSave,
  isSaving,
  error,
  placeholder = "—",
  disabled,
  dateFormat = "d. M. yyyy",
  allowClear = true,
  deadlineWarning,
}: EditableDateCellProps) {
  const [open, setOpen] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  // State pro text input
  const [inputValue, setInputValue] = React.useState("")
  const [parseError, setParseError] = React.useState<string | null>(null)

  // Visual feedback pro paste
  const [justPasted, setJustPasted] = React.useState(false)

  // Guard proti dvojitemu ukladani
  const [isSavingLocal, setIsSavingLocal] = React.useState(false)

  // Ref pro input autofocus
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Parse value to Date
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])

  // Sync input value when popover opens + autofocus
  React.useEffect(() => {
    if (open) {
      if (dateValue) {
        // Format bez mezer pro snazsi editaci
        setInputValue(format(dateValue, "d.M.yyyy", { locale: cs }))
      } else {
        setInputValue("")
      }
      setParseError(null)
      setJustPasted(false)

      // Autofocus s malym zpozdenim (ceka na renderovani popoveru)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [open, dateValue])

  const handleSelect = async (date: Date | undefined) => {
    if (isSavingLocal) return

    setIsSavingLocal(true)
    setOpen(false)

    try {
      if (date?.getTime() !== dateValue?.getTime()) {
        await onSave(date ?? null)
      }
    } finally {
      setIsSavingLocal(false)
    }
  }

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isSavingLocal) return

    setInputValue("")
    setParseError(null)
    setOpen(false)

    if (dateValue) {
      setIsSavingLocal(true)
      try {
        await onSave(null)
      } finally {
        setIsSavingLocal(false)
      }
    }
  }

  const handleToday = async () => {
    const today = new Date()
    // Normalizovat na zacatek dne
    today.setHours(0, 0, 0, 0)
    await handleSelect(today)
  }

  // Handler: Zmena textu v inputu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Vymazat chybu pri psani
    if (parseError) {
      setParseError(null)
    }
  }

  // Handler: Klavesnice v inputu
  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()

      // Prazdny input = zavrit bez zmeny (NE mazani!)
      if (!inputValue.trim()) {
        setOpen(false)
        return
      }

      const parsed = parseDateSmart(inputValue)
      if (parsed) {
        setParseError(null)
        await handleSelect(parsed)
      } else {
        setParseError("Neplatný formát. Použijte D.M.RRRR nebo RRRR-MM-DD")
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  // Handler: Paste z clipboardu
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text")
    const parsed = parseDateSmart(pastedText.trim())

    if (parsed) {
      e.preventDefault()
      // Naformatovat a vlozit do inputu
      setInputValue(format(parsed, "d.M.yyyy", { locale: cs }))
      setParseError(null)

      // Visual feedback
      setJustPasted(true)
      setTimeout(() => setJustPasted(false), 1500)

      // NEULOZIT automaticky - uzivatel musi stisknout Enter
    }
    // Pokud neni parsovatelne, necha default paste behavior
  }

  const formattedDate = dateValue ? format(dateValue, dateFormat, { locale: cs }) : null

  return (
    <div
      className={cn("relative", (isSaving || isSavingLocal) && "pointer-events-none opacity-50")}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !disabled && setOpen(true)}
            className={cn(
              "-mx-1 flex min-h-[28px] items-center gap-1 rounded px-1 py-0.5 transition-colors",
              !disabled && "hover:bg-muted/50 cursor-pointer",
              disabled && "cursor-default",
              error && "text-destructive"
            )}
          >
            {formattedDate ? (
              <div className="flex items-center gap-1">
                {deadlineWarning?.isExpired && (
                  <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${BASE_COLORS.red.textClass}`} />
                )}
                {deadlineWarning?.isExpiringSoon && !deadlineWarning?.isExpired && (
                  <AlertTriangle
                    className={`h-3.5 w-3.5 shrink-0 ${BASE_COLORS.orange.textClass}`}
                  />
                )}
                <span
                  className={cn(
                    "text-sm tabular-nums",
                    deadlineWarning?.isExpired && BASE_COLORS.red.textClass,
                    deadlineWarning?.isExpiringSoon &&
                      !deadlineWarning?.isExpired &&
                      BASE_COLORS.orange.textClass
                  )}
                >
                  {formattedDate}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            )}
            {/* Icons on hover */}
            {isHovered && !disabled && !formattedDate && (
              <CalendarIcon className="text-muted-foreground ml-auto h-3.5 w-3.5 shrink-0" />
            )}
            {isHovered && !disabled && formattedDate && (
              <Pencil className="text-muted-foreground/50 ml-auto h-3 w-3 shrink-0" />
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col">
            {/* Text input pro psani/paste datumu */}
            <div className="p-3 pb-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="D.M.RRRR"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onPaste={handlePaste}
                aria-label="Datum ve formátu den.měsíc.rok"
                aria-invalid={!!parseError}
                aria-describedby={parseError ? "date-parse-error" : undefined}
                className={cn(
                  "h-8 text-sm",
                  justPasted && "ring-2 ring-green-500/50 transition-shadow"
                )}
              />
              {parseError && (
                <p id="date-parse-error" role="alert" className="text-destructive mt-1 text-xs">
                  {parseError}
                </p>
              )}
            </div>

            {/* Dnes button */}
            <div className="px-3 pb-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-full text-xs"
                onClick={handleToday}
              >
                Dnes ({format(new Date(), "d. M. yyyy", { locale: cs })})
              </Button>
            </div>

            {/* Kalendar */}
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleSelect}
              defaultMonth={dateValue}
              locale={cs}
            />

            {/* Clear button - bezpecne uvnitr popoveru */}
            {allowClear && dateValue && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full"
                  onClick={handleClear}
                >
                  <X className="mr-2 h-4 w-4" />
                  Vymazat datum
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <span className="text-destructive absolute -bottom-4 left-0 text-xs">{error}</span>}
    </div>
  )
}
