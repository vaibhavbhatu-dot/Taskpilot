import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const SIZE_MAP = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
} as const

const COLOR_MAP = {
  default: "text-foreground",
  primary: "text-primary",
  muted:   "text-muted-foreground",
  white:   "text-white",
} as const

export interface SpinnerProps {
  size?: keyof typeof SIZE_MAP
  color?: keyof typeof COLOR_MAP
  className?: string
}

function Spinner({ size = "md", color = "default", className }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin", SIZE_MAP[size], COLOR_MAP[color], className)}
      aria-label="Loading"
    />
  )
}

export { Spinner }
