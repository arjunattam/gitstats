import {
  addDays,
  addHours,
  addSeconds,
  distanceInWords,
  endOfWeek,
  format,
  isWithinRange,
  parse,
  startOfWeek,
  subDays,
  subWeeks
} from "date-fns";

export const getWeekStart = () => {
  // Returns start of last week (which is a Sunday)
  const now = new Date();
  const previousWeek = subWeeks(now, 1);
  const start = startOfWeek(previousWeek, { weekStartsOn: 0 });
  return format(start, "YYYY-MM-DD");
};

export const getWeek = weekStart => {
  // weekStart looks like 2018-09-23
  const start = parse(`${weekStart}T00:00:00Z`);
  const end = endOfWeek(start);
  return { start, end };
};

export const getChartBounds = weekStart => {
  const start = parse(`${weekStart}T00:00:00Z`);
  const end = addDays(start, 7);
  return { startDate: start, endDate: end };
};

export const getLabels = date => {
  return {
    date: format(date, "MMM D"),
    day: format(date, "dddd")
  };
};

export const plusHours = (date, amount) => {
  return addHours(date, amount);
};

export const isInWeek = (date, weekStart) => {
  const start = parse(weekStart);
  const end = addDays(start, 7);
  return isWithinRange(date, start, end);
};

export const getChartWeek = weekUnix => {
  const parsed = parse(+weekUnix * 1000);
  return format(parsed, "MMM D");
};

export const getPeriod = (weekStart): IPeriod => {
  // TODO: this should return in UTC, not in local time zone
  const nextParsed = parse(`${weekStart}T00:00:00Z`);
  const prevParsed = subDays(nextParsed, 7);
  return { next: format(nextParsed), previous: format(prevParsed) };
};

export const getDurationLabel = (seconds: number): string => {
  const date = new Date();
  const withSeconds = addSeconds(date, seconds || 0);
  return distanceInWords(withSeconds, date);
};
