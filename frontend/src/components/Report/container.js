import React from "react";
import { Container as BSContainer } from "reactstrap";
import { Summary } from "./summary";
import { Members } from "./members";
import { Repos } from "./repos";
import { EmailSender } from "./email";
import { getChartBounds } from "../../utils/date";
import { PRChartContainer } from "../Charts/pulls";
import { CommitChartContainer } from "../Charts/commits";

export const Container = props => {
  const {
    reportJson,
    isLoading,
    prActivityData,
    commitsData,
    team,
    weekStart
  } = props;
  const dates = getChartBounds(weekStart);

  return (
    <BSContainer>
      <Summary {...reportJson} isLoading={isLoading} />
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
      <EmailSender team={team} weekStart={weekStart} />
    </BSContainer>
  );
};
