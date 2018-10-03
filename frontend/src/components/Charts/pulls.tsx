import * as React from "react";
import { TimelineChart } from "./base/timeline";

interface IPRChartContainerProps {
  selectedRepo: string;
  startDate: Date;
  endDate: Date;
  data: IPullRequestData[];
}

// TODO: when selectedRepo is null, it should prompt to filter
export class PRChartContainer extends React.Component<
  IPRChartContainerProps,
  {}
> {
  public render() {
    const { data, selectedRepo } = this.props;
    const selectedData = data.filter(item => item.repo === selectedRepo);
    let pullsData: IPullRequest[] = [];

    if (selectedData.length > 0) {
      pullsData = this.filteredPulls(selectedData[0].pulls);
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
