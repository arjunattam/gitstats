import {
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { ICommitsDeprecated, RepoForReport } from "../../../types";

interface IContainerProps {
  reposDeprecated: RepoForReport[];
  repos: IRepo[];
  members: IMember[];
  period: IPeriod;
  isLoading: boolean;
  pulls: IPullsAPIResult[];
  commits: ICommitsAPIResult[];
  commitsDeprecated: ICommitsDeprecated[];
  chartBounds: { startDate: Date; endDate: Date };
}

interface IContainerState {
  filteredRepo: { value: string; label: string };
  filteredMember: { value: string; label: string };
}

export class BaseFilteredContainer extends React.Component<
  IContainerProps,
  IContainerState
> {
  public state: IContainerState = {
    filteredMember: null,
    filteredRepo: null
  };

  public changeRepo = repo => {
    this.setState({ filteredRepo: repo });
  };

  public changeMember = member => {
    this.setState({ filteredMember: member });
  };
}
