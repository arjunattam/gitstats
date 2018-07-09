import * as moment from "moment";

type Period = {
  start: moment.Moment;
  end: moment.Moment;
};

const getStart = () => {
  return moment()
    .utc()
    .startOf("week");
};

const getCurrentPeriod = (): Period => ({
  start: getStart().subtract(1, "weeks"),
  end: getStart()
});

const getPreviousPeriod = (): Period => ({
  start: getStart().subtract(2, "weeks"),
  end: getStart().subtract(1, "weeks")
});

function getPeriodCount(response: Array<any>, period: Period, key: string) {
  const momentValues = response.filter(r => !!r[key]).map(r => moment(r[key]));
  const count = momentValues.reduce((prevValue, currentValue) => {
    const isInPeriod = currentValue > period.start && currentValue < period.end;
    return prevValue + (isInPeriod ? 1 : 0);
  }, 0);
  return { ...period, count };
}

function getPeriodDurations(
  response: Array<any>,
  period: Period,
  keyLeft,
  keyRight
) {
  const momentValues = response
    .filter(r => !!r[keyLeft] && !!r[keyRight])
    .map(r => ({ left: moment(r[keyLeft]), right: moment(r[keyRight]) }));
  const durations = momentValues.reduce((prevValue, currentValue) => {
    const isInPeriod =
      currentValue.left > period.start && currentValue.left < period.end;
    const diff = currentValue.left.diff(currentValue.right);
    return isInPeriod ? [...prevValue, diff / 1000.0] : prevValue;
  }, []);
  return durations;
}

export function getComparativeCounts(response: Array<any>, key: string) {
  return {
    next: getPeriodCount(response, getCurrentPeriod(), key).count,
    previous: getPeriodCount(response, getPreviousPeriod(), key).count
  };
}

export function getComparativeDurations(
  response: Array<any>,
  keyLeft: string,
  keyRight: string
) {
  return {
    next: getPeriodDurations(response, getCurrentPeriod(), keyLeft, keyRight),
    previous: getPeriodDurations(
      response,
      getPreviousPeriod(),
      keyLeft,
      keyRight
    )
  };
}
