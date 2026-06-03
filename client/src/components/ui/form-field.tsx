import * as React from "react"
import { Label } from "@/components/ui/label"

export interface FormFieldProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

function FormField({ label, hint, error, required, children, className }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      {label && (
        <Label required={required} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-xs text-[hsl(var(--color-error))]">{error}</p>
      )}
    </div>
  )
}

export { FormField }
