import * as moment from "moment";

type Period = {
  start: moment.Moment;
  end: moment.Moment;
};

const getCurrentPeriod = (): Period => ({
  start: moment().subtract(1, "weeks"),
  end: moment()
});

const getPreviousPeriod = (): Period => ({
  start: moment().subtract(2, "weeks"),
  end: moment().subtract(1, "weeks")
});

function getPeriodResponse(response: Array<any>, period: Period, key: string) {
  const momentValues = response.map(r => moment(r[key]));
  const count = momentValues.reduce((prevValue, currentValue) => {
    const isInPeriod = currentValue > period.start && currentValue < period.end;
    return prevValue + (isInPeriod ? 1 : 0);
  }, 0);
  return { ...period, count };
}

export function getComparativeResponse(response: Array<any>, key: string) {
  return [
    getPeriodResponse(response, getCurrentPeriod(), key),
    getPeriodResponse(response, getPreviousPeriod(), key)
  ];
}
