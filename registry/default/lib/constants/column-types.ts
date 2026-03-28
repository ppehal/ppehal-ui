import type { LucideIcon } from "lucide-react"
import {
  Type,
  Hash,
  Percent,
  Coins,
  Calendar,
  CalendarClock,
  Tag,
  ToggleRight,
  Mail,
  Phone,
  Code,
  Link2,
} from "lucide-react"
import type { ColumnDataType } from "@/registry/default/lib/table-types"

export interface ColumnTypeConfig {
  icon: LucideIcon
  label: string
  description: string
}

export const COLUMN_TYPE_CONFIG: Record<ColumnDataType, ColumnTypeConfig> = {
  text: {
    icon: Type,
    label: "Text",
    description: "Textové pole",
  },
  number: {
    icon: Hash,
    label: "Číslo",
    description: "Číselná hodnota",
  },
  percentage: {
    icon: Percent,
    label: "Procenta",
    description: "Procentuální hodnota",
  },
  currency: {
    icon: Coins,
    label: "Měna",
    description: "Částka v CZK",
  },
  date: {
    icon: Calendar,
    label: "Datum",
    description: "Datum",
  },
  datetime: {
    icon: CalendarClock,
    label: "Datum a čas",
    description: "Datum s časem",
  },
  enum: {
    icon: Tag,
    label: "Kategorie",
    description: "Výběr z možností",
  },
  boolean: {
    icon: ToggleRight,
    label: "Ano/Ne",
    description: "Pravdivostní hodnota",
  },
  email: {
    icon: Mail,
    label: "Email",
    description: "Emailová adresa",
  },
  phone: {
    icon: Phone,
    label: "Telefon",
    description: "Telefonní číslo",
  },
  code: {
    icon: Code,
    label: "Kód",
    description: "Identifikátor",
  },
  fk: {
    icon: Link2,
    label: "Odkaz",
    description: "Odkaz na jinou entitu",
  },
}
