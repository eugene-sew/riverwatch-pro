import { format } from 'date-fns'

/**
 * Safely formats a timestamp to a pattern without ever crashing the UI.
 * Handles ISO formats, SQLite space-separated formats, and browser parsing discrepancies.
 */
export function safeFormatDate(timestamp, pattern = 'HH:mm:ss') {
  if (!timestamp) return '--'
  try {
    // Convert string space to 'T' if standard ISO parser is strict (e.g. Safari/Firefox)
    let cleaned = String(timestamp)
    if (cleaned.includes(' ') && !cleaned.includes('T')) {
      // Replace the first space with 'T' (e.g. "2026-05-29 07:22:28" -> "2026-05-29T07:22:28")
      cleaned = cleaned.replace(' ', 'T')
    }

    const date = new Date(cleaned)
    if (isNaN(date.getTime())) {
      // Direct regex fallback: try to extract HH:MM:SS
      const match = String(timestamp).match(/\d{2}:\d{2}:\d{2}/)
      return match ? match[0] : '--'
    }

    return format(date, pattern)
  } catch (e) {
    console.warn('[safeFormatDate] Date formatting failed for:', timestamp, e)
    const match = String(timestamp).match(/\d{2}:\d{2}:\d{2}/)
    return match ? match[0] : '--'
  }
}
