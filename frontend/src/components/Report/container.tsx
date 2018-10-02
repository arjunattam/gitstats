import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { getChartBounds } from "../../utils/date";
import { CommitChartContainer } from "../Charts/commits";
import { PRChartContainer } from "../Charts/pulls";
import { Members } from "./members";
import { Repos } from "./repos";
import { SummaryRow } from "./summary";

interface IContainerProps {
  weekStart: string;
  isLoading: boolean;
  prActivityData: IPullRequestData[];
  period: IPeriod;
  reportJson: any;
  commitsData: any[];
}

export const Container: React.SFC<IContainerProps> = ({
  period,
  reportJson,
  isLoading,
  prActivityData,
  commitsData,
  weekStart
}) => {
  const dates = getChartBounds(weekStart);
  console.log("dates", dates);
  console.log("period", period);

  return (
    <div>
      <SummaryRow {...reportJson} period={period} prData={prActivityData} />
      <BootstrapContainer>
        <CommitChartContainer
          {...dates}
          commitsData={commitsData}
          prData={prActivityData}
        />
        <PRChartContainer
          {...dates}
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
