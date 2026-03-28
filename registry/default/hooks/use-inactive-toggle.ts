"use client"

import * as React from "react"
import { getStoredValue, setStoredValue } from "@/registry/default/lib/storage/browser-storage"

/**
 * Hook for managing inactive items toggle state with localStorage persistence
 * @param storageKey - localStorage key suffix for persisting the preference (auto-prefixed)
 * @returns { showInactive, toggle, setShowInactive }
 */
export function useInactiveToggle(storageKey: string) {
  const [showInactive, setShowInactive] = React.useState(false)

  // Load preference from localStorage on mount
  React.useEffect(() => {
    const stored = getStoredValue<boolean>(storageKey, false)
    if (stored) {
      setShowInactive(true)
    }
  }, [storageKey])

  // Toggle and persist to localStorage
  const toggle = React.useCallback(() => {
    setShowInactive((prev) => {
      const newValue = !prev
      setStoredValue(storageKey, newValue)
      return newValue
    })
  }, [storageKey])

  return { showInactive, toggle }
}
