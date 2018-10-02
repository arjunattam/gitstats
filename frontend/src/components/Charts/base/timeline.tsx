import * as d3 from "d3";
import * as React from "react";
import * as ReactFauxDOM from "react-faux-dom";
import "./index.css";
import { addLegend, addXAxis, COLORS, LEGEND_PADDING } from "./utils";

interface ITimelineChartProps {
  startDate: Date;
  endDate: Date;
  data: any;
}

export class TimelineChart extends React.Component<ITimelineChartProps, {}> {
  renderPR(prData, svg, x, y, yValue) {
    const { created_at, closed_at, commits, comments } = prData;
    const { title, url, number } = prData;
    const { startDate, endDate } = this.props;
    // Plot area
    let repoRoot = svg.append("g");
    var areaEnd = closed_at ? new Date(closed_at) : new Date(endDate);
    var areaWidth = x(areaEnd) - x(new Date(created_at));
    repoRoot
      .append("g")
      .append("rect")
      .attr("x", x(new Date(created_at)))
      .attr("y", y(yValue + 0.75))
      .attr("width", areaWidth)
      .attr("height", 15)
      .attr("fill", "#d9f0fde3");
    // Plot commits
    repoRoot
      .append("g")
      .selectAll("scatter-dots")
      .data(
        commits
          .filter(
            c => new Date(c.date) < endDate && new Date(c.date) > startDate
          )
          .map(c => [c.date, yValue + 0.45])
      )
      .enter()
      .append("svg:circle")
      .attr("cx", function(d, i) {
        return x(new Date(d[0]));
      })
      .attr("cy", function(d) {
        return y(d[1]);
      })
      .attr("r", 3)
      .attr("fill", COLORS.commit);
    // Plot comments
    repoRoot
      .append("g")
      .selectAll("scatter-dots")
      .data(
        comments
          .filter(
            c => new Date(c.date) < endDate && new Date(c.date) > startDate
          )
          .map(c => [c.date, yValue + 0.45])
      )
      .enter()
      .append("svg:circle")
      .attr("cx", function(d, i) {
        return x(new Date(d[0]));
      })
      .attr("cy", function(d) {
        return y(d[1]);
      })
      .attr("r", 3)
      .attr("fill", COLORS.pr_comment);
    // Title with url
    repoRoot
      .append("a")
      .attr("xlink:href", url)
      .attr("target", "_blank")
      .append("text")
      .attr("class", "pr-title")
      .style("font-size", "8px")
      .attr("y", y(yValue + 0.35))
      .attr("x", "20") // margin-left
      .text(`#${number}: ${title}`);
  }

  render() {
    if (!this.props.data) return null;

    const { data, startDate, endDate } = this.props;
    const count = data.length;
    const MIN_COUNT = 2;
    const axisStart = new Date(startDate);
    const axisEnd = new Date(endDate);

    var width = 600;
    var height = 30 * Math.max(MIN_COUNT, count) + LEGEND_PADDING;
    var margin = 25;
    var actualHeight = height - margin - LEGEND_PADDING;
    var actualWidth = width - 2 * margin;

    var x = d3
      .scaleTime()
      .domain([axisStart, axisEnd])
      .range([margin, margin + actualWidth])
      .clamp(true);
    var y = d3
      .scaleLinear()
      .domain([0, Math.max(MIN_COUNT, count)])
      .range([actualHeight, 0]);

    const div = new ReactFauxDOM.Element("div");
    let svg = d3
      .select(div)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`);
    addLegend(svg, width, COLORS);

    // Chart content
    var content = svg
      .append("g")
      .attr("transform", `translate(0,${LEGEND_PADDING})`);
    data.forEach((prData, index) => {
      this.renderPR(prData, content, x, y, index);
    });
    addXAxis(content, startDate, endDate, x, actualHeight);
    return div.toReact();
  }
}
