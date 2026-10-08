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

/**
 * Formats any date string (e.g., YYYY-MM-DD or ISO) into DD-MM-YYYY format.
 * Examples:
 * - "2026-08-17" -> "17-08-2026"
 * - "2026-08-17T00:00:00" -> "17-08-2026"
 */
export const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim().split('T')[0];

  const matchYYYYMMDD = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchYYYYMMDD) {
    const [, yyyy, mm, dd] = matchYYYYMMDD;
    return `${dd}-${mm}-${yyyy}`;
  }

  const matchDDMMYYYY = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (matchDDMMYYYY) {
    return str;
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return str;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return str;
  }
};

/**
 * Checks if a meeting date and time have passed.
 * Returns true if the date is strictly before today,
 * or if it is today and the specified meeting time has elapsed.
 */
export const isMeetingDatePassed = (dateStr, timeStr) => {
  if (!dateStr) return false;
  try {
    const cleanDateStr = String(dateStr).trim().split('T')[0];
    const now = new Date();

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (cleanDateStr < todayStr) {
      return true;
    }

    if (cleanDateStr > todayStr) {
      return false;
    }

    // If meeting is today, check if meeting time has passed
    if (timeStr) {
      const str = String(timeStr).trim();
      const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
      if (match) {
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const period = (match[3] || '').toUpperCase();
        if (period === 'PM' && hrs < 12) hrs += 12;
        if (period === 'AM' && hrs === 12) hrs = 0;

        const meetingTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hrs, mins, 0);
        return now > meetingTime;
      }
    }

    return false;
  } catch {
    return false;
  }
};

