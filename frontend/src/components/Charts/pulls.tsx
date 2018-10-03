import * as React from "react";
import { TimelineChart } from "./base/timeline";

interface IPRChartContainerProps {
  selectedRepo: string;
  startDate: Date;
  endDate: Date;
  data: any;
}

// TODO: in the case of ALL_REPOS, this chart should
// prompt to select a repo
export class PRChartContainer extends React.Component<
  IPRChartContainerProps,
  {}
> {
  public render() {
    const { data, selectedRepo } = this.props;
    const selected = selectedRepo || this.getDefaultSelected();
    const selectedData = data.filter(item => item.repo === selected);
    let pullsData = [];

    if (selectedData.length > 0) {
      pullsData = this.filteredPulls(selectedData[0].pulls);
    }

    return <TimelineChart {...this.props} data={pullsData} />;
  }

  private getDefaultSelected = () => {
    const { data } = this.props;
    if (data) {
      let selectedRepo = "";
      const filtered = data
        .map(({ repo, pulls }) => ({
          text: repo,
          value: this.filteredPulls(pulls).length
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);
      if (filtered.length) {
        selectedRepo = filtered[0].text;
      }
      return selectedRepo;
    }
  };

  private filteredPulls = pulls => {
    const { endDate, startDate } = this.props;
    return pulls.filter(
      pr =>
        new Date(pr.created_at) < endDate &&
        (pr.closed_at === null || new Date(pr.closed_at) > startDate)
    );
  };
}
