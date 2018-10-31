import { IPeriod, IPullRequest } from "gitstats-shared";
import * as React from "react";
import { getChartBounds } from "src/utils/date";
import { TimelineChart } from "./base/timeline";

interface IPRChartContainerProps {
  period: IPeriod;
  data: IPullRequest[];
}

export class PRChartContainer extends React.Component<
  IPRChartContainerProps,
  {}
> {
  public render() {
    const { data, period } = this.props;
    const { startDate, endDate } = getChartBounds(period);
    return (
      <TimelineChart
        data={this.filteredPulls(data)}
        startDate={startDate}
        endDate={endDate}
      />
    );
  }

  private filteredPulls = pulls => {
    const { endDate, startDate } = getChartBounds(this.props.period);
    return pulls.filter(
      pr =>
        new Date(pr.created_at) < endDate &&
        (pr.closed_at === null || new Date(pr.closed_at) > startDate)
    );
  };
}
