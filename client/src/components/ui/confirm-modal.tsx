import { Check, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"

export interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
  loading?: boolean
}

function ConfirmModal({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}: ConfirmModalProps) {
  function handleCancel() {
    onCancel?.()
    onOpenChange(false)
  }

  function handleConfirm() {
    onConfirm?.()
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={handleConfirm}
            loading={loading}
            leftIcon={
              !loading
                ? variant === "destructive"
                  ? <XCircle className="w-4 h-4" />
                  : <Check className="w-4 h-4" />
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      }
    />
  )
}

export { ConfirmModal }
