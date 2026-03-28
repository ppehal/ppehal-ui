/**
 * Centralized browser localStorage utility with automatic prefixing and error handling.
 *
 * Features:
 * - Configurable prefix for all keys (default: "app_")
 * - Safe JSON parsing with fallback to default values
 * - TypeScript type safety
 * - SSR-safe (returns defaults on server)
 *
 * @example
 * // Configure prefix for your app
 * setStoragePrefix("myapp_")
 *
 * // Simple usage
 * setStoredValue("sidebar_collapsed", true)
 * const collapsed = getStoredValue("sidebar_collapsed", false)
 *
 * // With complex types
 * interface UserPrefs { theme: string; lang: string }
 * setStoredValue("user_prefs", { theme: "dark", lang: "cs" })
 * const prefs = getStoredValue<UserPrefs>("user_prefs", { theme: "light", lang: "cs" })
 */

let storagePrefix = "app_"

/**
 * Set the storage key prefix used by all storage functions.
 * Call this once at app initialization to customize the prefix.
 */
export function setStoragePrefix(prefix: string) {
  storagePrefix = prefix
}

/**
 * Get a value from localStorage with automatic prefix and JSON parsing.
 * Returns defaultValue if key doesn't exist or parsing fails.
 */
export function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(`${storagePrefix}${key}`)
    if (item === null) {
      return defaultValue
    }
    return JSON.parse(item) as T
  } catch {
    // JSON parse error or localStorage access error
    return defaultValue
  }
}

/**
 * Set a value in localStorage with automatic prefix and JSON serialization.
 * Silently fails if localStorage is unavailable.
 */
export function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value))
  } catch {
    // Silently ignore storage errors (quota exceeded, private browsing, etc.)
  }
}

/**
 * Remove a value from localStorage.
 */
export function removeStoredValue(key: string): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.removeItem(`${storagePrefix}${key}`)
  } catch {
    // Silently ignore errors
  }
}

/**
 * Check if a key exists in localStorage.
 */
export function hasStoredValue(key: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    return localStorage.getItem(`${storagePrefix}${key}`) !== null
  } catch {
    return false
  }
}

/**
 * Get the full prefixed key (useful for debugging or direct localStorage access).
 */
export function getStorageKey(key: string): string {
  return `${storagePrefix}${key}`
}
