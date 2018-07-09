import React from "react";
import { Value, getPRsTime, getPRsOpened, getPRsMerged } from "./utils";

function millisecondsToStr(milliseconds) {
  // TIP: to find current time in milliseconds, use:
  // var  current_time_milliseconds = new Date().getTime();

  function numberEnding(number) {
    return number > 1 ? "s" : "";
  }

  var temp = Math.floor(milliseconds / 1000);
  var years = Math.floor(temp / 31536000);
  if (years) {
    return years + " year" + numberEnding(years);
  }
  //TODO: Months! Maybe weeks?
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
  return "less than a second"; //'just now' //or other string you like;
}

export const Pulls = ({ repos }) => {
  return (
    <table className="table">
      <thead className="thead-light">
        <tr>
          <th style={{ width: "40%" }}>Pull Requests</th>
          <th style={{ width: "20%" }}>Opened</th>
          <th style={{ width: "20%" }}>Merged</th>
          <th style={{ width: "20%" }}>Median time to merge</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total</td>
          <td>
            <Value {...getPRsOpened(repos)} />
          </td>
          <td>
            <Value {...getPRsMerged(repos)} />
          </td>
          <td>
            <Value
              {...getPRsTime(repos)}
              transformer={value => millisecondsToStr(value * 1000)}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
