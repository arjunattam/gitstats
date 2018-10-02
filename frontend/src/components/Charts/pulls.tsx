import * as React from "react";
import { ChartDropdown, TitleDiv } from "../Charts/utils";
import { Pulls } from "../Report/pulls";
import { TimelineChart } from "./base/timeline";

type PRChartContainerState = {
  selectedRepo: string;
};

type PRChartContainerProps = {
  startDate: Date;
  endDate: Date;
  data: any;
  reportJson: any;
  isLoading: boolean;
};

export class PRChartContainer extends React.Component<
  PRChartContainerProps,
  PRChartContainerState
> {
  state = { selectedRepo: "" };

  getDefaultSelected = () => {
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

  changeRepo = repo => {
    this.setState({ selectedRepo: repo });
  };

  filteredPulls = pulls => {
    const { endDate, startDate } = this.props;
    return pulls.filter(
      pr =>
        new Date(pr.created_at) < endDate &&
        (pr.closed_at === null || new Date(pr.closed_at) > startDate)
    );
  };

  render() {
    const { data, reportJson, isLoading } = this.props;
    const { repos: reportRepos } = reportJson;
    const { selectedRepo: stateSelected } = this.state;
    const selectedRepo = stateSelected || this.getDefaultSelected();
    const repos = data.map(({ repo, pulls }) => ({
      text: repo,
      value: this.filteredPulls(pulls).length
    }));
    const selectedData = data.filter(item => item.repo === selectedRepo);
    let pullsData = [];

    if (selectedData.length > 0) {
      pullsData = this.filteredPulls(selectedData[0].pulls);
    }

    return (
      <div>
        <TitleDiv>
          <div>
            <strong>Pull Requests</strong> this week
          </div>
          <div>
            <ChartDropdown
              selected={selectedRepo}
              items={repos}
              onSelect={this.changeRepo}
            />
          </div>
        </TitleDiv>
        <Pulls
          {...reportJson}
          isLoading={isLoading}
          repos={
            reportRepos
              ? reportRepos.filter(repo => repo.name === selectedRepo)
              : []
          }
        />
        <TimelineChart {...this.props} data={pullsData} />
      </div>
    );
  }
}
