"use client"

import * as React from "react"
import { AlignJustify, Menu, List } from "lucide-react"
import { Button } from "@/registry/default/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/registry/default/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/default/ui/tooltip"
import type { RowDensity } from "@/registry/default/hooks/use-table-preferences"

interface DensityToggleProps {
  value: RowDensity
  onChange: (value: RowDensity) => void
}

const DENSITY_CONFIG: Record<RowDensity, { label: string; icon: React.ReactNode }> = {
  compact: {
    label: "Kompaktní",
    icon: <AlignJustify className="h-4 w-4" />,
  },
  default: {
    label: "Výchozí",
    icon: <List className="h-4 w-4" />,
  },
  spacious: {
    label: "Prostorný",
    icon: <Menu className="h-4 w-4" />,
  },
}

export function DensityToggle({ value, onChange }: DensityToggleProps) {
  const currentConfig = DENSITY_CONFIG[value]

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              {currentConfig.icon}
              <span className="sr-only">Hustota řádků</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Hustota řádků</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-[140px]">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as RowDensity)}>
          <DropdownMenuRadioItem value="compact" className="gap-2">
            <AlignJustify className="h-4 w-4" />
            Kompaktní
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="default" className="gap-2">
            <List className="h-4 w-4" />
            Výchozí
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="spacious" className="gap-2">
            <Menu className="h-4 w-4" />
            Prostorný
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
