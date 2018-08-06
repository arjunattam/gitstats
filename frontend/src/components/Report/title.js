import React from "react";
import * as d3 from "d3";
import { TitleLoader } from "./loaders";

export const ReportTitle = ({ period, isLoading }) => {
  if (isLoading) {
    return <TitleLoader />;
  }

  const { next } = period;
  const start = new Date(next);
  const end = d3.timeDay.offset(start, 6);
  const mFormat = d3.timeFormat("%B %d");
  const dFormat = d3.timeFormat("%d");
  const isSameMonth = start.getMonth() === end.getMonth();

  return (
    <p className="lead">
      Report for the week of{" "}
      <strong>
        {mFormat(start)}-{isSameMonth ? dFormat(end) : mFormat(end)}
      </strong>
    </p>
  );
};
