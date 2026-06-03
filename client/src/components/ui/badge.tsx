import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:   "border border-transparent bg-primary text-primary-foreground",
        secondary: "border border-transparent bg-secondary text-secondary-foreground",
        outline:   "border border-current bg-transparent",
        success:   "border border-transparent bg-[hsl(var(--color-success))] text-[hsl(var(--color-success-foreground))]",
        warning:   "border border-transparent bg-[hsl(var(--color-warning))] text-[hsl(var(--color-warning-foreground))]",
        error:     "border border-transparent bg-[hsl(var(--color-error))] text-[hsl(var(--color-error-foreground))]",
        info:      "border border-transparent bg-[hsl(var(--color-info))] text-[hsl(var(--color-info-foreground))]",
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
