import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:        "bg-primary/10 text-primary border border-primary/20",
        secondary:      "bg-secondary text-secondary-foreground border border-transparent",
        outline:        "border border-current bg-transparent",
        success:        "bg-[hsl(var(--color-success))]/10 text-[hsl(var(--color-success))] border border-[hsl(var(--color-success))]/25",
        warning:        "bg-[hsl(var(--color-warning))]/10 text-[hsl(var(--color-warning))] border border-[hsl(var(--color-warning))]/25",
        error:          "bg-[hsl(var(--color-error))]/10 text-[hsl(var(--color-error))] border border-[hsl(var(--color-error))]/25",
        info:           "bg-[hsl(var(--color-info))]/10 text-[hsl(var(--color-info))] border border-[hsl(var(--color-info))]/25",
        // Ticket-status-specific variants
        design:         "bg-[#EFF6FF] text-[#1d4ed8] border border-[#bfdbfe]",
        backlog:        "bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]",
        "in-development": "bg-[#FFF7ED] text-[#c2410c] border border-[#fed7aa]",
        qa:             "bg-[#EFF6FF] text-[#1d4ed8] border border-[#bfdbfe]",
        live:           "bg-[#F0FDF4] text-[#15803d] border border-[#bbf7d0]",
        requirements:   "bg-[#F5F3FF] text-[#6d28d9] border border-[#ddd6fe]",
      },
      size: {
        sm: "text-xs px-1.5 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
