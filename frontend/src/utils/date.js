import startOfWeek from "date-fns/start_of_week";
import parse from "date-fns/parse";
import format from "date-fns/format";
import subWeeks from "date-fns/sub_weeks";
import endOfWeek from "date-fns/end_of_week";

export const getWeekStart = () => {
  // Returns start of last week (which is a Sunday)
  const now = new Date();
  const previousWeek = subWeeks(now, 1);
  const start = startOfWeek(previousWeek, { weekStartsOn: 0 });
  return format(start, "YYYY-MM-DD");
};

export const getWeekLabel = weekStart => {
  const start = parse(weekStart);
  const end = endOfWeek(start);
  const formatter = d => format(d, "ddd, MMM D");
  return `${formatter(start)} to ${formatter(end)}`;
};
