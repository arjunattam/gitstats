import * as d3 from "d3";
import { IPullRequest } from "gitstats-shared";
import * as React from "react";
import * as ReactFauxDOM from "react-faux-dom";
import "./index.css";
import { addLegend, addXAxis, CHART_COLORS } from "./utils";

const LEGEND_PADDING = 40;

interface ITimelineChartProps {
  startDate: Date;
  endDate: Date;
  data: IPullRequest[];
}

export class TimelineChart extends React.Component<ITimelineChartProps, {}> {
  public render() {
    const { data, startDate, endDate } = this.props;
    const count = data.length;
    const MIN_COUNT = 2;
    const axisStart = new Date(startDate);
    const axisEnd = new Date(endDate);

    const width = 600;
    const height = 30 * Math.max(MIN_COUNT, count) + LEGEND_PADDING;
    const margin = 25;
    const actualHeight = height - margin - LEGEND_PADDING;
    const actualWidth = width - 2 * margin;

    const x = d3
      .scaleTime()
      .domain([axisStart, axisEnd])
      .range([margin, margin + actualWidth])
      .clamp(true);
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(MIN_COUNT, count)])
      .range([actualHeight, 0]);

    const div = new ReactFauxDOM.Element("div");
    const svg = d3
      .select(div)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`);

    addLegend(svg, width, LEGEND_PADDING);

    // Chart content
    const content = svg
      .append("g")
      .attr("transform", `translate(0,${LEGEND_PADDING})`);
    data.forEach((prData, index) => {
      this.renderPR(prData, content, x, y, index);
    });
    addXAxis(content, startDate, endDate, x, actualHeight);
    return div.toReact();
  }

  private renderPR(prData: IPullRequest, svg, x, y, yValue) {
    const { created_at, closed_at, commits, comments } = prData;
    const { title, url, number: idNumber, state } = prData;
    const { startDate, endDate } = this.props;

    // Plot area
    const repoRoot = svg.append("g");
    const areaEnd = closed_at ? new Date(closed_at) : new Date(endDate);
    const areaWidth = x(areaEnd) - x(new Date(created_at));
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
      .attr("cx", (d, i) => x(new Date(d[0])))
      .attr("cy", d => y(d[1]))
      .attr("r", 3)
      .attr("fill", CHART_COLORS.commit);

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
      .attr("cx", (d, i) => x(new Date(d[0])))
      .attr("cy", d => y(d[1]))
      .attr("r", 3)
      .attr("fill", CHART_COLORS.pr_comment);

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
      .text(`#${idNumber}: ${title} (${state})`);
  }
}
