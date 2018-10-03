import React from "react";
import { Value, getPRsTime, getPRsOpened, getPRsMerged } from "../utils";
import Table from "../table";

function millisecondsToStr(milliseconds) {
  function numberEnding(number) {
    return number > 1 ? "s" : "";
  }

  var temp = Math.floor(milliseconds / 1000);
  var years = Math.floor(temp / 31536000);
  if (years) {
    return years + " year" + numberEnding(years);
  }
  var days = Math.floor((temp %= 31536000) / 86400);
  if (days) {
    return days + " day" + numberEnding(days);
  }
  var hours = Math.floor((temp %= 86400) / 3600);
  if (hours) {
    return hours + " hour" + numberEnding(hours);
  }
  var minutes = Math.floor((temp %= 3600) / 60);
  if (minutes) {
    return minutes + " minute" + numberEnding(minutes);
  }
  var seconds = temp % 60;
  if (seconds) {
    return seconds + " second" + numberEnding(seconds);
  }
  return "less than a second";
}

export const Pulls = ({ period, repos, isLoading }) => {
  const hasAllData = repos
    ? !repos.filter(repo => repo.stats.is_pending).length
    : false;
  const rowData = repos
    ? [
        {
          key: "total",
          isLoading: !hasAllData,
          values: [
            <Value {...getPRsOpened(period, repos)} />,
            <Value {...getPRsMerged(period, repos)} />,
            <Value
              {...getPRsTime(period, repos)}
              transformer={value => millisecondsToStr(value * 1000)}
            />
          ]
        }
      ]
    : [{}];

  return (
    <Table
      rowHeadings={["Opened", "Merged", "Median time to merge"]}
      rowLimit={5}
      isLoading={isLoading}
      rowData={rowData}
    />
  );
};
