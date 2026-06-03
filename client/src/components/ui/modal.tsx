import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const SIZE_MAP = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-xl",
  full: "max-w-full",
} as const

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  size?: keyof typeof SIZE_MAP
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(SIZE_MAP[size], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

// Re-export sub-components under Modal namespace aliases
const ModalHeader      = DialogHeader
const ModalTitle       = DialogTitle
const ModalDescription = DialogDescription
const ModalFooter      = DialogFooter
const ModalClose       = DialogClose

export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalClose }
