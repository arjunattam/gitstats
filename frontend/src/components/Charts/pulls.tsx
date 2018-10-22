import * as React from "react";
import { IPullRequest, IPullRequestData } from "../../types";
import { TimelineChart } from "./base/timeline";

interface IPRChartContainerProps {
  startDate: Date;
  endDate: Date;
  data: IPullRequestData[];
}

// TODO: this needs a repo to be selected, so prompt if there is none
export class PRChartContainer extends React.Component<
  IPRChartContainerProps,
  {}
> {
  public render() {
    const { data } = this.props;
    let pullsData: IPullRequest[] = [];

    if (data.length > 0) {
      pullsData = this.filteredPulls(data[0].pulls);
    }

    return <TimelineChart {...this.props} data={pullsData} />;
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
