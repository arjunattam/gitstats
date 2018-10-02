import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { getChartBounds } from "../../utils/date";
import { PRChartContainer } from "../Charts/pulls";
import { LighterContainer } from "./common";
import { Members } from "./members";
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

export const Container: React.SFC<IContainerProps> = ({
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

      <BootstrapContainer>
        <PRChartContainer
          {...chartBounds}
          reportJson={reportJson}
          isLoading={isLoading}
          data={prActivityData}
        />
      </BootstrapContainer>

      <LighterContainer>
        <Members {...reportJson} period={period} isLoading={isLoading} />
        <Repos {...reportJson} period={period} isLoading={isLoading} />
      </LighterContainer>
    </div>
  );
};
