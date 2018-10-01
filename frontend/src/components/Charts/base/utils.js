import * as d3 from "d3";
import { plusHours } from "../../../utils/date";

export const LEGEND_PADDING = 40;

export const COLORS = {
  commit: "#ffb154",
  pr_comment: "#5b88d6"
};

export const addLegend = (svg, width, colorMap) => {
  var legend = svg
    .append("g")
    .attr("class", "g-legend")
    .attr("transform", `translate(${width / 2 - 40},${LEGEND_PADDING / 2})`);

  legend
    .append("svg:circle")
    .attr("r", 3)
    .attr("fill", colorMap.commit);

  legend
    .append("text")
    .attr("x", "5")
    .attr("y", "2.5")
    .text("Commits");

  legend
    .append("svg:circle")
    .attr("r", 3)
    .attr("cx", "50")
    .attr("fill", colorMap.pr_comment);

  legend
    .append("text")
    .attr("x", "55")
    .attr("y", "2.5")
    .text("PR comments");
};

export const addXAxis = (svg, startDate, endDate, x, actualHeight) => {
  let xTicks = [];

  for (let i = new Date(startDate); i <= endDate; i = plusHours(i, 12)) {
    xTicks.push(new Date(i));
  }

  var xAxis = d3
    .axisBottom(x)
    .tickValues(xTicks)
    .tickFormat(function(d) {
      if (d.getUTCHours() === 12) {
        return d3.timeFormat("%A")(d);
      }
    });
  svg
    .append("g")
    .attr("transform", `translate(0,${actualHeight})`)
    .call(xAxis);

  // Remove ticks for the middle value
  svg.selectAll("line").attr("y2", function(d) {
    return d && d.getUTCHours() === 12 ? 0 : 6;
  });
};
