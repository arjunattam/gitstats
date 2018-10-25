import { IMember, IPeriod, IPullsAPIResult } from "gitstats-shared";
import * as React from "react";
import { ICommits, RepoForReport } from "../../types";
import { getChartBounds } from "../../utils/date";
import { LighterContainer } from "./common";
import { MembersTable } from "./members";
import { PullsContainer } from "./pulls";
import { ReposTable } from "./repos";
import { SummaryContainer } from "./summary";

interface IContainerProps {
  isLoading: boolean;
  pulls: IPullsAPIResult[];
  period: IPeriod;
  members: IMember[];
  repos: RepoForReport[];
  commits: ICommits[];
}

export const ReportContainer: React.SFC<IContainerProps> = props => {
  const { period } = props;
  const chartBounds = getChartBounds(period);
  return (
    <div>
      <SummaryContainer {...props} chartBounds={chartBounds} />
      <PullsContainer {...props} chartBounds={chartBounds} />
      <LighterContainer>
        <MembersTable {...props} />
        <ReposTable {...props} />
      </LighterContainer>
    </div>
  );
};
