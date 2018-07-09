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

function getPeriodResponse(response: Array<any>, period: Period, key: string) {
  const momentValues = response.filter(r => !!r[key]).map(r => moment(r[key]));
  const count = momentValues.reduce((prevValue, currentValue) => {
    const isInPeriod = currentValue > period.start && currentValue < period.end;
    return prevValue + (isInPeriod ? 1 : 0);
  }, 0);
  return { ...period, count };
}

export function getComparativeResponse(response: Array<any>, key: string) {
  return {
    next: getPeriodResponse(response, getCurrentPeriod(), key).count,
    previous: getPeriodResponse(response, getPreviousPeriod(), key).count
  };
}
