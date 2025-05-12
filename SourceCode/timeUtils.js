/**
 * Parses a time string in "HH:MM" 24-hour format into hours and minutes.
 * Throws an error if the format is invalid.
 *
 * @param {string} timeStr - Time string like "09:30" or "17:45"
 * @returns {{ hours: number, minutes: number }}
 */
export function parseTimeString(timeStr) {
  if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
    throw new Error("Invalid time format. Please use HH:MM");
  }
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

/**
 * Converts an object with hours and minutes into a zero-padded "HH:MM" string.
 *
 * @param {{ hours: number, minutes: number }} param0
 * @returns {string} - Time string in 24-hour format
 */
export function formatTimeString({ hours, minutes }) {
  return [String(hours).padStart(2, '0'), String(minutes).padStart(2, '0')].join(':');
}

/**
 * Adds a specified number of minutes to a time string ("HH:MM").
 * Wraps around 24-hour time (e.g., 23:50 + 20 min → 00:10).
 *
 * @param {string} timeStr - Start time in "HH:MM"
 * @param {number} minutesToAdd - Minutes to add
 * @returns {string} - New time string in "HH:MM"
 */
export function addMinutesToTime(timeStr, minutesToAdd) {
  const { hours, minutes } = parseTimeString(timeStr);
  let totalMinutes = hours * 60 + minutes + minutesToAdd;

  // Wrap around 24 hours (1440 minutes) and ensure non-negative
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  return formatTimeString({ hours: newHours, minutes: newMinutes });
}

/**
 * Parses a time string like "3:45 PM" into a Date object based on a base date.
 *
 * @param {string} timeStr - Time string in "HH:MM AM/PM" format
 * @param {Date} baseDate - The date to apply the time onto
 * @returns {Date|null} - Combined date and time object or null if format is invalid
 */
export function parseDateTime(timeStr, baseDate) {
  const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeParts) return null;

  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);
  const period = timeParts[3].toUpperCase();

  // Convert 12-hour time to 24-hour
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Converts a "HH:MM" 24-hour format time string into a Date object based on baseDate.
 *
 * @param {string} input - Time string in 24-hour format
 * @param {Date} baseDate - Date to attach the time to (defaults to now)
 * @returns {Date}
 */
export function parseHHMMToDate(input, baseDate = new Date()) {
  const { hours, minutes } = parseTimeString(input);
  const parsedDate = new Date(baseDate);
  parsedDate.setHours(hours, minutes, 0, 0);
  return parsedDate;
}
