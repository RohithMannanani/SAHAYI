/**
 * Helper utility to group and sort savings/collection logs per week in descending order of dates/weeks.
 */

export function parseLogDate(dateStr) {
  if (!dateStr) return new Date();
  if (typeof dateStr === 'string') {
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
  }
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

/**
 * Helper to sort member log items in a consistent role/index arrangement across all tables.
 */
export function sortMembersByRoleOrIndex(items = [], allMembers = []) {
  if (!Array.isArray(items)) return [];

  const getRank = (item) => {
    if (!item) return 9999;
    const memUserId = String(item.userId || item.UserId || item.id || '');
    const memName = (item.name || item.Name || '').toLowerCase().trim();

    // 1. Position in allMembers array if provided (unit role hierarchy)
    if (Array.isArray(allMembers) && allMembers.length > 0) {
      const idx = allMembers.findIndex(m => {
        const mUserId = String(m.userId || m.UserId || m.id || '');
        const mName = (m.name || m.Name || '').toLowerCase().trim();
        return (mUserId && memUserId && mUserId === memUserId) || (mName && memName && mName === memName);
      });
      if (idx !== -1) return idx;
    }

    // 2. Member ID number (e.g. "AK-001" -> 1, "AK-002" -> 2)
    const mIdStr = String(item.memberId || item.MemberId || '');
    const numMatch = mIdStr.match(/\d+/);
    if (numMatch) {
      return parseInt(numMatch[0], 10);
    }

    // 3. Fallback numeric userId or id
    if (item.userId && !isNaN(Number(item.userId))) return Number(item.userId);
    if (item.id && !isNaN(Number(item.id))) return Number(item.id);

    return 9999;
  };

  return [...items].sort((a, b) => getRank(a) - getRank(b));
}

function formatYMD(d) {
  if (!d || isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWeeklyCollectionLogs(savingsLogs = [], allMembers = []) {
  if (!Array.isArray(savingsLogs)) savingsLogs = [];

  const logsToProcess = [...savingsLogs];
  const weekMap = new Map();

  logsToProcess.forEach(item => {
    const d = parseLogDate(item.date);
    const { monday, sunday } = getWeekRange(d);
    const weekKey = formatYMD(monday);

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
    // Avoid duplicate item insertions for same transaction
    if (!group.items.some(i => i.id === item.id || (i.userId && item.userId && i.userId === item.userId && i.date === item.date))) {
      group.items.push({
        ...item,
        savingsWeekId: item.savingsWeekId || null,
        paidDate: item.paidDate || item.date
      });

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
    }
  });

  // Always ensure current calendar week entry exists in weekMap so the current active week is always visible and seeded with Pending members
  const { monday: curMonday, sunday: curSunday } = getWeekRange(new Date());
  const curWeekKey = formatYMD(curMonday);
  if (!weekMap.has(curWeekKey)) {
    const startMonth = curMonday.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = curSunday.toLocaleDateString('en-US', { month: 'short' });
    const year = curMonday.getFullYear();
    const weekTitle = startMonth === endMonth
      ? `${startMonth} ${curMonday.getDate()} – ${curSunday.getDate()}, ${year}`
      : `${startMonth} ${curMonday.getDate()} – ${endMonth} ${curSunday.getDate()}, ${year}`;

    const startOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (curMonday - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

    weekMap.set(curWeekKey, {
      weekKey: curWeekKey,
      mondayTimestamp: curMonday.getTime(),
      weekNumber,
      year,
      weekTitle,
      mondayStr: curMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      sundayStr: curSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: [],
      totalCollected: 0,
      cashTotal: 0,
      onlineTotal: 0,
      paidCount: 0,
      pendingCount: 0
    });
  }

  // Fill missing unit members as Pending for each weekly log so every member's status is included
  if (Array.isArray(allMembers) && allMembers.length > 0) {
    weekMap.forEach((group, weekKey) => {
      allMembers.forEach((mem) => {
        const memUserId = mem.userId || mem.id;
        const exists = group.items.some(
          item =>
            (item.userId && memUserId && String(item.userId) === String(memUserId)) ||
            (item.id && memUserId && String(item.id) === String(memUserId)) ||
            (item.name && mem.name && item.name.toLowerCase().trim() === mem.name.toLowerCase().trim())
        );

        if (!exists) {
          group.items.push({
            id: `pending-${memUserId || Math.random()}-${weekKey}`,
            userId: memUserId,
            savingsWeekId: null,
            weekKey: weekKey,
            weekTitle: group.weekTitle,
            name: mem.name,
            memberId: mem.memberId || `AK-${memUserId}`,
            amount: '100.00',
            status: 'Pending',
            paymentMode: '-',
            date: weekKey,
            paidDate: '-'
          });
          group.pendingCount += 1;
        }
      });
    });
  }

  // Sort groups in DESCENDING order of mondayTimestamp (most recent week first)
  const sortedWeeks = Array.from(weekMap.values()).sort((a, b) => b.mondayTimestamp - a.mondayTimestamp);

  // Sort items within each week in consistent role-based member order across all tables
  sortedWeeks.forEach(group => {
    group.items = sortMembersByRoleOrIndex(group.items, allMembers);
  });

  return sortedWeeks;
}
