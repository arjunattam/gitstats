import {
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { ICommitsDeprecated, RepoForReport } from "../../types";
import { GrayContainer } from "./common";
import { MembersTable } from "./members";
import { PullsContainer } from "./pulls";
import { ReposTable } from "./repos";
import { SummaryContainer } from "./summary";

interface IContainerProps {
  isLoading: boolean;
  pulls: IPullsAPIResult[];
  period: IPeriod;
  members: IMember[];
  repos: IRepo[];
  commits: ICommitsAPIResult[];
  reposDeprecated: RepoForReport[];
  commitsDeprecated: ICommitsDeprecated[];
}

export const ReportContainer: React.SFC<IContainerProps> = props => {
  return (
    <div>
      <SummaryContainer {...props} />
      <PullsContainer {...props} />
      <GrayContainer>
        <MembersTable {...props} />
        <ReposTable {...props} />
      </GrayContainer>
    </div>
  );
};
