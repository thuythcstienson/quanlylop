/**
 * Utility functions for School Academic Calendar & Week management
 * Class 9A1 - THCS Vân Hà 2 (2026-2027)
 * Base start: Thứ Hai 07/09/2026 = Tuần 1
 */

export const SEMESTER_START_DATE_STR = '2026-09-07';

// Standard Days of Week in Vietnamese
export const DAYS_OF_WEEK_VN: { [key: number]: string } = {
  0: 'Chủ Nhật',
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
};

/**
 * Format Date to YYYY-MM-DD in local time
 */
export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Date to DD/MM/YYYY
 */
export function formatDDMMYYYY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parse YYYY-MM-DD safely into Date at 00:00:00
 */
export function parseDateLocal(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
}

/**
 * Get Vietnamese Day of Week name from Date or date string
 */
export function getDayOfWeekName(dateOrStr: Date | string): string {
  const d = typeof dateOrStr === 'string' ? parseDateLocal(dateOrStr) : dateOrStr;
  return DAYS_OF_WEEK_VN[d.getDay()] || 'Thứ Hai';
}

/**
 * Calculate academic week number from date
 * Week 1 begins on Monday 2026-09-07
 */
export function getAcademicWeek(dateOrStr?: Date | string): number {
  const target = dateOrStr 
    ? (typeof dateOrStr === 'string' ? parseDateLocal(dateOrStr) : new Date(dateOrStr))
    : new Date();

  const start = parseDateLocal(SEMESTER_START_DATE_STR);
  
  // Set both to midnight for accurate day diff
  target.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 1;

  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(35, Math.max(1, week));
}

/**
 * Get the Monday and Sunday date range for a given week number
 */
export function getWeekDateRange(weekNum: number): {
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
  rangeLabel: string;
} {
  const start = parseDateLocal(SEMESTER_START_DATE_STR);
  const monday = new Date(start);
  monday.setDate(start.getDate() + (weekNum - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDateStr = toISODateString(monday);
  const endDateStr = toISODateString(sunday);
  const rangeLabel = `${formatDDMMYYYY(monday)} – ${formatDDMMYYYY(sunday)}`;

  return {
    startDate: monday,
    endDate: sunday,
    startDateStr,
    endDateStr,
    rangeLabel,
  };
}

export interface AcademicWeekInfo {
  weekNumber: number;
  label: string;
  shortLabel: string;
  rangeLabel: string;
  startDateStr: string;
  endDateStr: string;
  isCurrent: boolean;
}

/**
 * Generate full list of academic weeks (1..35)
 */
export function getAcademicWeeksList(totalWeeks = 35): AcademicWeekInfo[] {
  const currentWeek = getAcademicWeek(new Date());
  const list: AcademicWeekInfo[] = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const range = getWeekDateRange(w);
    list.push({
      weekNumber: w,
      label: `Tuần ${w} (${range.rangeLabel})${w === currentWeek ? ' • Hiện tại' : ''}`,
      shortLabel: `Tuần ${w}`,
      rangeLabel: range.rangeLabel,
      startDateStr: range.startDateStr,
      endDateStr: range.endDateStr,
      isCurrent: w === currentWeek,
    });
  }

  return list;
}

export interface WeekDayOption {
  dayIndex: number;
  dayName: string;
  shortDay: string;
  dateStr: string;
  displayDate: string;
  displayShort: string;
  fullLabel: string;
  isToday: boolean;
}

/**
 * Get all 7 days (Thứ 2 to Chủ Nhật) for a given academic week
 */
export function getDaysOfWeekForAcademicWeek(weekNum: number): WeekDayOption[] {
  const range = getWeekDateRange(weekNum);
  const days: WeekDayOption[] = [];
  const todayStr = toISODateString(new Date());

  const dayNames = [
    { idx: 1, name: 'Thứ Hai', short: 'Thứ 2' },
    { idx: 2, name: 'Thứ Ba', short: 'Thứ 3' },
    { idx: 3, name: 'Thứ Tư', short: 'Thứ 4' },
    { idx: 4, name: 'Thứ Năm', short: 'Thứ 5' },
    { idx: 5, name: 'Thứ Sáu', short: 'Thứ 6' },
    { idx: 6, name: 'Thứ Bảy', short: 'Thứ 7' },
    { idx: 0, name: 'Chủ Nhật', short: 'Chủ Nhật' },
  ];

  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(range.startDate);
    d.setDate(range.startDate.getDate() + offset);
    const dateStr = toISODateString(d);
    const dayMeta = dayNames[offset];
    const displayDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

    days.push({
      dayIndex: dayMeta.idx,
      dayName: dayMeta.name,
      shortDay: dayMeta.short,
      dateStr,
      displayDate,
      displayShort: `${dayMeta.short} (${displayDate})`,
      fullLabel: `${dayMeta.name}, ${formatDDMMYYYY(d)}`,
      isToday: dateStr === todayStr,
    });
  }

  return days;
}
