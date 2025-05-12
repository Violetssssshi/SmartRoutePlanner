import { parseDateTime, parseHHMMToDate } from './timeUtils.js';
// Maps numeric day indices (0 = Sunday, 1 = Monday, ...) to weekday names
const weekdayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Predicts whether a location will be open or closed at the given arrival time.
 *
 * @param {Object} data - The location data object, including weekdayText.
 * @param {string} arrivalTimeStr - The expected arrival time in "HH:MM" or "HH:MM AM/PM" format.
 * @returns {string} - Returns "Will be Open", "Will be Closed", or "Unknown".
 */

export function predictOpenStatus(data, arrivalTimeStr) {
  // Get the trip date from the UI and convert to local Date object (00:00 time)
  const startDateStr = document.getElementById("start-date").value;
  const [year, month, day] = startDateStr.split("-").map(Number);
  const baseDate = new Date(year, month - 1, day);

  // Parse arrival time string into a Date object, trying both AM/PM and 24-hour formats
  const arrivalDate = parseDateTime(arrivalTimeStr, baseDate) || parseHHMMToDate(arrivalTimeStr, baseDate);

  // If parsing fails, return Unknown
  if (!arrivalDate) return "Unknown";

  const arrivalDay = weekdayMap[arrivalDate.getDay()];
  const arrivalTime = arrivalDate.getTime();

  // Get weekly schedule (if any) from the place data
  const weekdayText = data.weekdayText || data.weekday_text || [];
  if (!Array.isArray(weekdayText) || weekdayText.length === 0) return "Unknown";

  // Find today's opening hours (e.g., "Monday: 10:00 AM – 9:00 PM")
  const todayText = weekdayText.find(t => t.startsWith(arrivalDay));
  // Handle explicit "Closed" or "Open 24 hours"
  if (!todayText || todayText.includes("Closed")) return "Will be Closed";
  if (!todayText || todayText.includes("Open 24 hours")) return "Will be Open";

  // Split the time ranges for today (e.g., "10:00 AM – 2:00 PM, 5:00 PM – 9:00 PM")
  const intervals = todayText.replace(`${arrivalDay}:`, "").split(/,\s*/);

  for (const interval of intervals) {
    // Split each interval into opening and closing times
    const [openStr, closeStr] = interval.split(/\s*[–—-]\s*/).map(s => s.trim());
    // Convert opening and closing time strings into Date objects
    const openDate = parseDateTime(openStr, baseDate) || parseHHMMToDate(openStr, baseDate);
    let closeDate = parseDateTime(closeStr, baseDate) || parseHHMMToDate(closeStr, baseDate);

    if (!openDate || !closeDate) continue;

    // Handle overnight hours (e.g., 10:00 PM – 2:00 AM)
    if (closeDate.getTime() <= openDate.getTime()) {
      closeDate.setDate(closeDate.getDate() + 1);
    }

    // Check if arrival time falls within this interval
    if (arrivalTime >= openDate.getTime() && arrivalTime <= closeDate.getTime()) {
      return "Will be Open";
    }
  }

  return "Will be Closed";
}
