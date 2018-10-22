import * as React from "react";
import { ICommits, IPeriod, IPullRequestData, IReportJson } from "../../types";
import { getChartBounds } from "../../utils/date";
import { LighterContainer } from "./common";
import { Members } from "./members";
import { PullsContainer } from "./pulls";
import { Repos } from "./repos";
import { SummaryContainer } from "./summary";

interface IContainerProps {
  weekStart: string;
  isLoading: boolean;
  prActivityData: IPullRequestData[];
  period: IPeriod;
  reportJson: IReportJson;
  commitsData: ICommits[];
}

export const ReportContainer: React.SFC<IContainerProps> = ({
  period,
  reportJson,
  isLoading,
  prActivityData,
  commitsData,
  weekStart
}) => {
  const chartBounds = getChartBounds(weekStart);
  const { repos, members } = reportJson;
  // TODO: period is not in UTC

  // TODO: filter comments inside pr activity that belong to bots
  // like code-cov
  return (
    <div>
      <SummaryContainer
        period={period}
        repos={repos}
        members={members}
        isLoading={isLoading}
        prActivityData={prActivityData}
        commitsData={commitsData}
        chartBounds={chartBounds}
      />

      <PullsContainer
        period={period}
        repos={repos}
        members={members}
        isLoading={isLoading}
        prActivityData={prActivityData}
        chartBounds={chartBounds}
      />

      <LighterContainer>
        <Members {...reportJson} period={period} isLoading={isLoading} />
        <Repos {...reportJson} period={period} isLoading={isLoading} />
      </LighterContainer>
    </div>
  );
};
