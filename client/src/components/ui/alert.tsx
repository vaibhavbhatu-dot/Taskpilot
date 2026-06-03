import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default:     "bg-background text-foreground [&>svg]:text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        error:       "border-[hsl(var(--color-error))] bg-[hsl(var(--color-error))]/10 text-[hsl(var(--color-error))] [&>svg]:text-[hsl(var(--color-error))]",
        success:     "border-[hsl(var(--color-success))] bg-[hsl(var(--color-success))]/10 text-[hsl(var(--color-success))] [&>svg]:text-[hsl(var(--color-success))]",
        warning:     "border-[hsl(var(--color-warning))] bg-[hsl(var(--color-warning))]/10 text-[hsl(var(--color-warning))] [&>svg]:text-[hsl(var(--color-warning))]",
        info:        "border-[hsl(var(--color-info))] bg-[hsl(var(--color-info))]/10 text-[hsl(var(--color-info))] [&>svg]:text-[hsl(var(--color-info))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const AUTO_ICONS = {
  success:     CheckCircle2,
  warning:     AlertTriangle,
  info:        Info,
  error:       XCircle,
  destructive: XCircle,
  default:     null,
} as const

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, children, ...props }, ref) => {
    const key = (variant ?? "default") as keyof typeof AUTO_ICONS
    const Icon = AUTO_ICONS[key] ?? null

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
