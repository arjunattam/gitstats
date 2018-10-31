import {
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { ICommitsDeprecated, RepoForReport } from "../../types";
import { getChartBounds } from "../../utils/date";
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
  const { period } = props;
  const chartBounds = getChartBounds(period);
  return (
    <div>
      <SummaryContainer {...props} chartBounds={chartBounds} />
      <PullsContainer {...props} chartBounds={chartBounds} />
      <GrayContainer>
        <MembersTable {...props} />
        <ReposTable {...props} />
      </GrayContainer>
    </div>
  );
};
