/**
 * Helper utility to group and sort savings/collection logs per week in descending order of dates/weeks.
 */

export function parseLogDate(dateStr) {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function getWeekRange(dateObj) {
  const validDate = new Date(dateObj);
  const dayOfWeek = validDate.getDay(); // 0 = Sun, 1 = Mon...
  
  // Calculate Monday as start of week
  const diffToMonday = validDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(validDate.getFullYear(), validDate.getMonth(), diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

export function getWeeklyCollectionLogs(savingsLogs = []) {
  if (!Array.isArray(savingsLogs)) return [];

  const logsToProcess = [...savingsLogs];

  const weekMap = new Map();

  logsToProcess.forEach(item => {
    const d = parseLogDate(item.date);
    const { monday, sunday } = getWeekRange(d);
    const weekKey = monday.toISOString().split('T')[0];

    // Format week title e.g. "Aug 10 - Aug 16, 2026"
    const startMonth = monday.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = sunday.toLocaleDateString('en-US', { month: 'short' });
    const year = monday.getFullYear();
    const weekTitle = startMonth === endMonth
      ? `${startMonth} ${monday.getDate()} – ${sunday.getDate()}, ${year}`
      : `${startMonth} ${monday.getDate()} – ${endMonth} ${sunday.getDate()}, ${year}`;

    // Week number calculation
    const startOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (monday - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        weekKey,
        mondayTimestamp: monday.getTime(),
        weekNumber,
        year,
        weekTitle,
        mondayStr: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        sundayStr: sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        items: [],
        totalCollected: 0,
        cashTotal: 0,
        onlineTotal: 0,
        paidCount: 0,
        pendingCount: 0
      });
    }

    const group = weekMap.get(weekKey);
    group.items.push(item);

    const amt = parseFloat(item.amount) || 0;
    if (item.status === 'Paid') {
      group.totalCollected += amt;
      group.paidCount += 1;

      const mode = (item.paymentMode || '').toLowerCase();
      if (mode.includes('online')) {
        group.onlineTotal += amt;
      } else {
        group.cashTotal += amt;
      }
    } else {
      group.pendingCount += 1;
    }
  });

  // Sort groups in DESCENDING order of mondayTimestamp (most recent week first)
  const sortedWeeks = Array.from(weekMap.values()).sort((a, b) => b.mondayTimestamp - a.mondayTimestamp);

  // Sort items within each week by date DESCENDING
  sortedWeeks.forEach(group => {
    group.items.sort((a, b) => {
      const dateA = parseLogDate(a.date).getTime();
      const dateB = parseLogDate(b.date).getTime();
      return dateB - dateA;
    });
  });

  return sortedWeeks;
}
