import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isOverdue(
  dueDate: string | null | undefined,
  status: string,
): boolean {
  if (!dueDate) return false
  const completedStatuses = ['DONE', 'LIVE', 'CANCELLED', 'DEPLOYED']
  if (completedStatuses.includes(status)) return false
  return new Date(dueDate) < new Date()
}
