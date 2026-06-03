import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-ring",
        error:   "border-[hsl(var(--color-error))] focus-visible:ring-[hsl(var(--color-error))]",
        success: "border-[hsl(var(--color-success))] focus-visible:ring-[hsl(var(--color-success))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
    VariantProps<typeof inputVariants> {
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"]
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, leftSlot, rightSlot, ...props }, ref) => {
    const input = (
      <input
        type={type}
        className={cn(
          inputVariants({ variant }),
          leftSlot  && "pl-9",
          rightSlot && "pr-9",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!leftSlot && !rightSlot) return input

    return (
      <div className="relative w-full">
        {leftSlot && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center">
            {leftSlot}
          </span>
        )}
        {input}
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center">
            {rightSlot}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
