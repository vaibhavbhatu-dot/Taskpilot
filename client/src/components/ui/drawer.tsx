import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type DrawerSide = "left" | "right" | "bottom"
type DrawerSize = "sm" | "md" | "lg"

const LATERAL_SIZE: Record<DrawerSize, string> = {
  sm: "w-72",
  md: "w-96",
  lg: "w-[480px]",
}

const BOTTOM_SIZE: Record<DrawerSize, string> = {
  sm: "h-1/3",
  md: "h-1/2",
  lg: "h-2/3",
}

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  side?: DrawerSide
  size?: DrawerSize
  children?: React.ReactNode
  className?: string
}

function Drawer({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  size = "md",
  children,
  className,
}: DrawerProps) {
  const sizeClass =
    side === "bottom" ? BOTTOM_SIZE[size] : LATERAL_SIZE[size]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn(sizeClass, className)}>
        {(title || description) && (
          <SheetHeader className="mb-4">
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        {children}
      </SheetContent>
    </Sheet>
  )
}

export { Drawer }
