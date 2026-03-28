import { cn } from "@/lib/utils"

interface NullValueProps {
  className?: string
  italic?: boolean
}

export function NullValue({ className, italic }: NullValueProps) {
  return <span className={cn("text-muted-foreground", italic && "italic", className)}>—</span>
}
