import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { getChartBounds } from "../../utils/date";
import { CommitChartContainer } from "../Charts/commits";
import { PRChartContainer } from "../Charts/pulls";
import { Members } from "./members";
import { Repos } from "./repos";
import { SummaryRow } from "./summary";

export const Container = props => {
  const {
    reportJson,
    isLoading,
    prActivityData,
    commitsData,
    weekStart
  } = props;
  const dates = getChartBounds(weekStart);
  // TODO: we shouldn't depend on reportJson to get us period
  return (
    <div>
      <SummaryRow {...reportJson} prData={prActivityData} />
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
        <Members {...reportJson} isLoading={isLoading} />
        <Repos {...reportJson} isLoading={isLoading} />
      </BootstrapContainer>
    </div>
  );
};
