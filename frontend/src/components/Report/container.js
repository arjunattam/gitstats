import React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { SummaryRow } from "./summary";
import { Members } from "./members";
import { Repos } from "./repos";
import { getChartBounds } from "../../utils/date";
import { PRChartContainer } from "../Charts/pulls";
import { CommitChartContainer } from "../Charts/commits";

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
