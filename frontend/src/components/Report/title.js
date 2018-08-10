import React from "react";
import * as d3 from "d3";
import { TitleLoader } from "./loaders";

const Muted = ({ children }) => <span className="text-muted">{children}</span>;

export const ReportTitle = ({ period, isLoading }) => {
  if (isLoading) {
    return <TitleLoader />;
  }

  const { next } = period;
  const start = new Date(next);
  const end = d3.timeDay.offset(start, 6);
  const mFormat = d3.timeFormat("%B %-d");
  const dFormat = d3.timeFormat("%-d");
  const isSameMonth = start.getMonth() === end.getMonth();
  const startDate = mFormat(start);
  const endDate = isSameMonth ? dFormat(end) : mFormat(end);

  return (
    <p className="h2">
      <Muted>Week of</Muted> {startDate} <Muted>to</Muted> {endDate}
    </p>
  );
};
