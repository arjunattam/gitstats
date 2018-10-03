import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { PRChartContainer } from "../../Charts/pulls";
import { ALL_MEMBERS, ALL_REPOS, Filters } from "../common/filters";
import { getPRsMerged, getPRsOpened } from "../utils";
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
    selectedMember: ALL_MEMBERS,
    selectedRepo: ALL_REPOS
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
    const reportJson = { members, repos };

    const { selectedMember, selectedRepo } = this.state;
    const repoItems = [];
    const memberItems = [];

    const filteredRepos = repos.filter(
      repo => (selectedRepo === ALL_REPOS ? true : repo.name === selectedRepo)
    );
    const authorFilter =
      selectedMember === ALL_MEMBERS ? undefined : selectedMember;
    const prsOpened = getPRsOpened(period, filteredRepos, authorFilter);
    const prsMerged = getPRsMerged(period, filteredRepos, authorFilter);
    // const prComments = getPRComments(period, prActivityData);
    const prComments = getPRsMerged(period, filteredRepos, authorFilter);

    return (
      <BootstrapContainer>
        <Filters
          title={"Pull Requests"}
          repos={repoItems}
          selectedRepo={selectedRepo}
          changeRepo={this.changeRepo}
          showAllRepos={this.showAllRepos}
          members={memberItems}
          selectedMember={selectedMember}
          changeMember={this.changeMember}
          showAllMembers={this.showAllMembers}
        />

        <PullsRow
          prsOpened={prsOpened}
          prsMerged={prsMerged}
          prComments={prComments}
          isLoading={isLoading}
        />

        <PRChartContainer
          {...chartBounds}
          reportJson={reportJson}
          isLoading={isLoading}
          data={prActivityData}
        />
      </BootstrapContainer>
    );
  }

  private changeRepo = repo => {
    this.setState({ selectedRepo: repo });
  };

  private showAllRepos = () => {
    this.setState({ selectedRepo: ALL_REPOS });
  };

  private changeMember = member => {
    this.setState({ selectedMember: member });
  };

  private showAllMembers = () => {
    this.setState({ selectedMember: ALL_MEMBERS });
  };
}
