import startOfWeek from "date-fns/start_of_week";
import parse from "date-fns/parse";
import format from "date-fns/format";
import subWeeks from "date-fns/sub_weeks";
import endOfWeek from "date-fns/end_of_week";
import { addDays, addHours, isWithinRange } from "date-fns";

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
    day: format(date, "dddd"),
    date: format(date, "MMM D")
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
