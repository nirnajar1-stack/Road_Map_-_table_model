import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachWeekOfInterval,
  endOfWeek,
  format,
  getWeekOfMonth,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { he } from "date-fns/locale";
import type { RoadmapTask } from "./types";

export const WEEK_STARTS_ON = 0 as const;
export const FACTOR_COL_WIDTH = 200;
export const WEEK_COL_WIDTH = 96;
/** Below this width (px), task title is shown above the bar instead of inside */
export const MIN_TASK_BAR_LABEL_WIDTH = 80;

export interface WeekColumn {
  index: number;
  weekStart: Date;
  weekEnd: Date;
  monthKey: string;
  monthLabel: string;
  weekOfMonth: number;
}

export interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  weekCount: number;
  startIndex: number;
}

export function parseDateOnly(iso: string): Date {
  return startOfDay(parseISO(iso.length > 10 ? iso.slice(0, 10) : iso));
}

export function toDateOnlyString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function buildWeekColumns(rangeStart: Date, rangeEnd: Date): WeekColumn[] {
  const start = startOfWeek(rangeStart, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(rangeEnd, { weekStartsOn: WEEK_STARTS_ON });

  return eachWeekOfInterval({ start, end }, { weekStartsOn: WEEK_STARTS_ON }).map(
    (weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: WEEK_STARTS_ON });
      const monthKey = format(weekStart, "yyyy-MM");

      return {
        index,
        weekStart,
        weekEnd,
        monthKey,
        monthLabel: format(weekStart, "MMMM yyyy", { locale: he }),
        weekOfMonth: getWeekOfMonth(weekStart, { weekStartsOn: WEEK_STARTS_ON }),
      };
    }
  );
}

export function groupWeeksByMonth(weeks: WeekColumn[]): MonthGroup[] {
  const groups: MonthGroup[] = [];

  weeks.forEach((week) => {
    const last = groups[groups.length - 1];
    if (!last || last.monthKey !== week.monthKey) {
      groups.push({
        monthKey: week.monthKey,
        monthLabel: week.monthLabel,
        weekCount: 1,
        startIndex: week.index,
      });
    } else {
      last.weekCount += 1;
    }
  });

  return groups;
}

export function getProjectDateRange(
  tasks: RoadmapTask[],
  paddingMonths = 1
): { start: Date; end: Date } {
  const today = startOfDay(new Date());

  if (tasks.length === 0) {
    return {
      start: startOfMonth(today),
      end: endOfWeek(addMonths(today, 2), { weekStartsOn: WEEK_STARTS_ON }),
    };
  }

  const starts = tasks.map((t) => parseDateOnly(t.startDate));
  const ends = tasks.map((t) => parseDateOnly(t.endDate));

  const minStart = minDate(starts);
  const maxEnd = maxDate(ends);

  return {
    start: startOfMonth(addMonths(minStart, -paddingMonths)),
    end: endOfWeek(addMonths(maxEnd, paddingMonths), { weekStartsOn: WEEK_STARTS_ON }),
  };
}

export function getTaskBarPosition(
  task: RoadmapTask,
  weeks: WeekColumn[],
  columnWidth = WEEK_COL_WIDTH
): { right: number; width: number } | null {
  if (weeks.length === 0) return null;

  const totalWidth = weeks.length * columnWidth;
  const timelineStart = weeks[0].weekStart;
  const timelineEnd = weeks[weeks.length - 1].weekEnd;

  const taskStart = parseDateOnly(task.startDate);
  const taskEnd = parseDateOnly(task.endDate);
  const [start, end] =
    taskStart <= taskEnd ? [taskStart, taskEnd] : [taskEnd, taskStart];

  if (end < timelineStart || start > timelineEnd) return null;

  const totalDays = differenceInCalendarDays(timelineEnd, timelineStart) + 1;
  const startDay = Math.max(0, differenceInCalendarDays(start, timelineStart));
  const endDay = Math.min(totalDays - 1, differenceInCalendarDays(end, timelineStart));
  const durationDays = endDay - startDay + 1;

  const right = (startDay / totalDays) * totalWidth + 2;
  const width = Math.max((durationDays / totalDays) * totalWidth - 4, 8);

  return { right, width };
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  return `${format(start, "d/M/yy", { locale: he })} – ${format(end, "d/M/yy", { locale: he })}`;
}

export function addDaysToDateString(dateStr: string, days: number): string {
  return toDateOnlyString(addDays(parseDateOnly(dateStr), days));
}
