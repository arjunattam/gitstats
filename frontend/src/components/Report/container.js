import React from "react";
import * as d3 from "d3";
import { Container as BSContainer } from "reactstrap";
import { Summary } from "./summary";
import { Members } from "./members";
import { Repos } from "./repos";
import { EmailSender } from "./email";
import { CommitChartContainer, PRChartContainer } from "./charts";

export const Container = props => {
  const {
    reportJson,
    isLoading,
    prActivityData,
    commitsData,
    team,
    weekStart
  } = props;
  const thisWeekStart = d3.utcSunday(new Date());
  const copy = new Date(thisWeekStart);
  const startDate = d3.utcSunday(new Date(copy.setDate(copy.getDate() - 7)));
  const dates = {
    startDate,
    endDate: thisWeekStart
  };
  console.log(dates);

  return (
    <BSContainer>
      <Summary {...reportJson} isLoading={isLoading} />
      <PRChartContainer
        {...dates}
        reportJson={reportJson}
        isLoading={isLoading}
        data={prActivityData}
      />
      <Members {...reportJson} isLoading={isLoading} />
      <Repos {...reportJson} isLoading={isLoading} />
      <CommitChartContainer
        {...dates}
        commitsData={commitsData}
        prData={prActivityData}
      />
      <EmailSender team={team} weekStart={weekStart} />
    </BSContainer>
  );
};
