import { useState, useCallback } from "react"

export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState)

  return {
    isOpen,
    open:   useCallback(() => setIsOpen(true), []),
    close:  useCallback(() => setIsOpen(false), []),
    toggle: useCallback(() => setIsOpen(prev => !prev), []),
    props:  { open: isOpen, onOpenChange: setIsOpen },
  }
}
