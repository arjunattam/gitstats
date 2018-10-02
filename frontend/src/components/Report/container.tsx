import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { getChartBounds } from "../../utils/date";
import { PRChartContainer } from "../Charts/pulls";
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
  const { repos } = reportJson;
  // TODO: period is not in UTC
  return (
    <div>
      <SummaryContainer
        period={period}
        repos={repos}
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
        <Members {...reportJson} period={period} isLoading={isLoading} />
        <Repos {...reportJson} period={period} isLoading={isLoading} />
      </BootstrapContainer>
    </div>
  );
};
