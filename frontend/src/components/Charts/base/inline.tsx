import * as d3 from "d3";
import * as React from "react";
import * as ReactFauxDOM from "react-faux-dom";
import { CHART_COLORS } from "./utils";

interface IInlineStackedProps {
  commits: number;
  comments: number;
  width: number;
  height: number;
}

export const InlineStacked: React.SFC<IInlineStackedProps> = props => {
  const div = new ReactFauxDOM.Element("div");
  const { commits, comments, width, height } = props;

  const svg = d3
    .select(div)
    .attr("style", `width: 100%; height: ${height}px;`)
    .append("svg")
    .attr("height", height)
    .attr("width", "100%")
    .attr("preserveAspectRatio", "none")
    .attr("viewBox", `0 0 ${width} ${height}`);
  const content = svg.append("g").attr("transform", `translate(0,0)`);

  content
    .append("rect")
    .attr("fill", CHART_COLORS.commit)
    .attr("x", 0)
    .attr("height", "100%")
    .attr("width", commits);

  content
    .append("rect")
    .attr("fill", CHART_COLORS.pr_comment)
    .attr("x", commits)
    .attr("height", "100%")
    .attr("width", comments);

  return div.toReact();
};
