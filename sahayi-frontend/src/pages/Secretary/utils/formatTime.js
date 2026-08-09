/**
 * Formats any time string into HH:MM AM/PM format.
 * Examples:
 * - "10:00:00 AM" -> "10:00 AM"
 * - "14:30" -> "02:30 PM"
 * - "9:5" -> "09:05 AM"
 */
export const formatTimeTo12Hr = (timeStr) => {
  if (!timeStr) return '10:00 AM';

  const str = String(timeStr).trim();

  // If matches 12-hr format like "10:00 AM" or "10:00:00 AM" or "2:30 PM"
  const match12 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    const hrs = String(parseInt(match12[1], 10)).padStart(2, '0');
    const mins = match12[2].padStart(2, '0');
    const period = match12[3].toUpperCase();
    return `${hrs}:${mins} ${period}`;
  }

  // If matches 24-hr time like "14:30:00" or "14:30" or "9:15"
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let hrs = parseInt(match24[1], 10);
    const mins = match24[2].padStart(2, '0');
    const period = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;
    const hrsStr = String(hrs).padStart(2, '0');
    return `${hrsStr}:${mins} ${period}`;
  }

  return str;
};
