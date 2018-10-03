import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { PRChartContainer } from "../../Charts/pulls";
import { Filters } from "../common/filters";
import { getPRsMerged, getPRsOpened, getPRsTime } from "../utils";
import { PullsRow } from "./row";

interface IContainerProps {
  repos: IRepository[];
  members: IMember[];
  period: IPeriod;
  isLoading: boolean;
  prActivityData: IPullRequestData[];
  chartBounds: { startDate: Date; endDate: Date };
}

interface IContainerState {
  selectedRepo: string;
  selectedMember: string;
}

export class PullsContainer extends React.Component<
  IContainerProps,
  IContainerState
> {
  public state = {
    selectedMember: null,
    selectedRepo: null
  };

  public render() {
    const {
      period,
      chartBounds,
      isLoading,
      members,
      repos,
      prActivityData
    } = this.props;
    const { selectedMember, selectedRepo } = this.state;
    const repoItems = [];
    const memberItems = [];

    const filteredRepos = repos.filter(
      repo => (!selectedRepo ? true : repo.name === selectedRepo)
    );
    const authorFilter = !selectedMember ? undefined : selectedMember;
    const prsOpened = getPRsOpened(period, filteredRepos, authorFilter);
    const prsMerged = getPRsMerged(period, filteredRepos, authorFilter);
    // const prComments = getPRComments(period, prActivityData);
    const prComments = getPRsMerged(period, filteredRepos, authorFilter);
    const medianMergeTimes = getPRsTime(period, filteredRepos, authorFilter);

    return (
      <BootstrapContainer>
        <Filters
          title={"Pull Requests"}
          repos={repoItems}
          changeRepo={this.changeRepo}
          members={memberItems}
          changeMember={this.changeMember}
        />

        <PullsRow
          prsOpened={prsOpened}
          prsMerged={prsMerged}
          prComments={prComments}
          medianMergeTimes={medianMergeTimes}
          isLoading={isLoading}
        />

        <PRChartContainer
          {...chartBounds}
          selectedRepo={"sentry-python"}
          data={prActivityData}
        />
      </BootstrapContainer>
    );
  }

  private changeRepo = repo => {
    this.setState({ selectedRepo: repo });
  };

  private changeMember = member => {
    this.setState({ selectedMember: member });
  };
}
