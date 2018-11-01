import {
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { GrayContainer } from "../common";
import { SummaryCharts } from "./charts";
import { SummaryTable } from "./table";

interface IContainerProps {
  repos: IRepo[];
  members: IMember[];
  period: IPeriod;
  isLoading: boolean;
  pulls: IPullsAPIResult[];
  commits: ICommitsAPIResult[];
}

interface IContainerState {
  selectedRepos: string[];
  selectedMembers: string[];
}

export class SummaryContainer extends React.Component<IContainerProps, {}> {
  public state: IContainerState = {
    selectedMembers: [],
    selectedRepos: []
  };

  public render() {
    return (
      <GrayContainer>
        <h4>Activity summary</h4>

        <SummaryCharts {...this.props} {...this.state} />

        <SummaryTable
          {...this.props}
          {...this.state}
          onRepoSelected={this.onRepoSelected}
          onMemberSelected={this.onMemberSelected}
        />
      </GrayContainer>
    );
  }

  private onRepoSelected = selectedRepos => {
    this.setState({ selectedRepos });
  };

  private onMemberSelected = selectedMembers => {
    this.setState({ selectedMembers });
  };
}
