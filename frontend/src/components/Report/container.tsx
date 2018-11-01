import {
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { PullsContainer } from "./pulls";
import { SummaryContainer } from "./summary";

interface IContainerProps {
  isLoading: boolean;
  pulls: IPullsAPIResult[];
  period: IPeriod;
  members: IMember[];
  repos: IRepo[];
  commits: ICommitsAPIResult[];
}

export const ReportContainer: React.SFC<IContainerProps> = props => {
  return (
    <div>
      <SummaryContainer {...props} />
      <PullsContainer {...props} />
    </div>
  );
};
