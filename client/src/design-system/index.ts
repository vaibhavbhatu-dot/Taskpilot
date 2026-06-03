// ── UI primitives ─────────────────────────────────────────────────────────────
export { Button, buttonVariants } from "@/components/ui/button"
export type { ButtonProps } from "@/components/ui/button"

export { Input } from "@/components/ui/input"
export type { InputProps } from "@/components/ui/input"

export { Textarea } from "@/components/ui/textarea"
export type { TextareaProps } from "@/components/ui/textarea"

export { Label } from "@/components/ui/label"
export type { LabelProps } from "@/components/ui/label"

export { FormField } from "@/components/ui/form-field"
export type { FormFieldProps } from "@/components/ui/form-field"

export {
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter, CardAction,
} from "@/components/ui/card"
export type { CardProps } from "@/components/ui/card"

export { Badge, badgeVariants } from "@/components/ui/badge"
export type { BadgeProps } from "@/components/ui/badge"

// ── Feedback ──────────────────────────────────────────────────────────────────
export { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
export type { AlertProps } from "@/components/ui/alert"

export { Spinner } from "@/components/ui/spinner"
export type { SpinnerProps } from "@/components/ui/spinner"

export {
  Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar,
} from "@/components/ui/Skeleton"

// ── Overlays ──────────────────────────────────────────────────────────────────
export {
  Modal, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from "@/components/ui/modal"
export type { ModalProps } from "@/components/ui/modal"

export { ConfirmModal } from "@/components/ui/confirm-modal"
export type { ConfirmModalProps } from "@/components/ui/confirm-modal"

export { Drawer } from "@/components/ui/drawer"
export type { DrawerProps } from "@/components/ui/drawer"

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useToast } from "@/design-system/hooks/useToast"
export { useModal } from "@/design-system/hooks/useModal"

// ── Utils ─────────────────────────────────────────────────────────────────────
export { cn } from "@/lib/utils"
export * from "@/design-system/utils/formatters"

// ── Tokens ────────────────────────────────────────────────────────────────────
export * from "@/design-system/tokens"

// ── Types ─────────────────────────────────────────────────────────────────────
export type * from "@/design-system/types"
