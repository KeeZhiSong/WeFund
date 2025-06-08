import { Timestamp } from "firebase/firestore"

/**
 * Safely convert various date formats to JavaScript Date object
 */
export function safeToDate(value: any): Date {
  try {
    // If it's already a valid Date object
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value
    }

    // If it's a Firestore Timestamp
    if (value instanceof Timestamp) {
      return value.toDate()
    }

    // If it's a string or number, try to parse it
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date
      }
    }

    // If it has seconds and nanoseconds (Firestore timestamp-like object)
    if (value && typeof value === "object" && "seconds" in value) {
      return new Date(value.seconds * 1000)
    }

    // Fallback to current date
    console.warn("Invalid date value, using current date as fallback:", value)
    return new Date()
  } catch (error) {
    console.error("Error converting date:", error)
    return new Date()
  }
}

/**
 * Convert Date to ISO string for HTML date input
 */
export function dateToInputString(date: Date | any): string {
  try {
    const safeDate = safeToDate(date)
    return safeDate.toISOString().split("T")[0]
  } catch (error) {
    console.error("Error converting date to input string:", error)
    // Return tomorrow as fallback
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }
}

/**
 * Calculate days left from end date
 */
export function calculateDaysLeft(endDate: Date | any): number {
  try {
    const safeEndDate = safeToDate(endDate)
    const now = new Date()
    const diffTime = safeEndDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  } catch (error) {
    console.error("Error calculating days left:", error)
    return 0
  }
}

/**
 * Format date for display
 */
export function formatDisplayDate(date: Date | any): string {
  try {
    const safeDate = safeToDate(date)
    return safeDate.toLocaleDateString()
  } catch (error) {
    console.error("Error formatting display date:", error)
    return "Unknown date"
  }
}
