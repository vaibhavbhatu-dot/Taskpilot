import { toast } from "sonner"

export const useToast = () => ({
  success: (msg: string, description?: string) =>
    toast.success(msg, { description }),
  error: (msg: string, description?: string) =>
    toast.error(msg, { description }),
  warning: (msg: string, description?: string) =>
    toast.warning(msg, { description }),
  info: (msg: string, description?: string) =>
    toast.info(msg, { description }),
  loading: (msg: string) => toast.loading(msg),
  dismiss: () => toast.dismiss(),
})
