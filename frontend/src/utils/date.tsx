import {
  addDays,
  addHours,
  addSeconds,
  distanceInWords,
  isWithinRange,
  parse
} from "date-fns";

function parseISOString(s) {
  const b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

export const getChartBounds = period => {
  return {
    endDate: parseISOString(period.current.end),
    startDate: parseISOString(period.current.start)
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

export const getDurationLabel = (seconds: number): string => {
  if (seconds === 0) {
    return `--`;
  }

  const date = new Date();
  const withSeconds = addSeconds(date, seconds || 0);
  return distanceInWords(withSeconds, date);
};
