import { IMember, IPeriod, IPullsAPIResult } from "gitstats-shared";
import * as React from "react";
import { ICommits, RepoForReport } from "../../../types";

interface IContainerProps {
  repos: RepoForReport[];
  members: IMember[];
  period: IPeriod;
  isLoading: boolean;
  pulls: IPullsAPIResult[];
  commits: ICommits[];
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
