import { IPullRequest } from "gitstats-shared";
import * as React from "react";
import { TimelineChart } from "./base/timeline";

interface IPRChartContainerProps {
  startDate: Date;
  endDate: Date;
  data: IPullRequest[];
}

export class PRChartContainer extends React.Component<
  IPRChartContainerProps,
  {}
> {
  public render() {
    const { data } = this.props;
    return <TimelineChart {...this.props} data={this.filteredPulls(data)} />;
  }

  private filteredPulls = pulls => {
    const { endDate, startDate } = this.props;
    return pulls.filter(
      pr =>
        new Date(pr.created_at) < endDate &&
        (pr.closed_at === null || new Date(pr.closed_at) > startDate)
    );
  };
}
