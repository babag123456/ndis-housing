/**
 * The persistence seam.
 *
 * The navigator talks to this interface, never to localStorage directly, so the
 * store can move to a database later without the journey code changing. The
 * interface is deliberately async even though localStorage is not.
 */
export interface JourneyStorage {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}

/** Used during server rendering, where there is nothing to read or write. */
export const emptyJourneyStorage: JourneyStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

/**
 * Browser storage. Every call is guarded: private browsing modes and full
 * quotas throw, and a person losing their saved answers must not also lose the
 * screen they are on.
 */
export const localJourneyStorage: JourneyStorage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Saving is a convenience. The journey keeps working in memory.
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // As above.
    }
  },
}

export function journeyStorage(): JourneyStorage {
  return typeof window === 'undefined' ? emptyJourneyStorage : localJourneyStorage
}
