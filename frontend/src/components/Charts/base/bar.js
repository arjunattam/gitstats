import React from "react";
import ReactFauxDOM from "react-faux-dom";
import * as d3 from "d3";
import { COLORS, LEGEND_PADDING } from "./utils";
import "./index.css";

export class BarChart extends React.Component {
  render() {
    const div = new ReactFauxDOM.Element("div");
    const { data } = this.props;

    const MIN_Y_VALUE = 5;
    var width = 600;
    var height = 150 + LEGEND_PADDING;
    var margin = 25;
    var actualHeight = height - margin - LEGEND_PADDING;
    var actualWidth = width - 2 * margin;

    var x = d3
      .scaleBand()
      .rangeRound([margin, margin + actualWidth])
      .padding(0.3)
      .domain(
        data.map(function(d) {
          return d.week;
        })
      );

    var y = d3
      .scaleLinear()
      .rangeRound([actualHeight, 0])
      .domain([
        0,
        d3.max(data, function(d) {
          return Math.max(d.value, MIN_Y_VALUE);
        })
      ]);

    let svg = d3
      .select(div)
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .classed("svg-content-responsive", true);

    // Chart content
    var content = svg
      .append("g")
      .classed("g-content", true)
      .attr("transform", `translate(0,${LEGEND_PADDING})`);

    content
      .append("g")
      .attr("transform", `translate(0,${actualHeight})`)
      .call(
        d3.axisBottom(x).tickFormat(function(d) {
          const date = new Date(d * 1000);
          const formatter = d3.timeFormat("%b %d");
          return `Week of ${formatter(date)}`;
        })
      );

    content
      .append("g")
      .attr("transform", `translate(${margin},0)`)
      .call(d3.axisLeft(y).ticks(3));

    content
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("fill", COLORS.commit)
      .attr("x", function(d) {
        return x(d.week);
      })
      .attr("y", function(d) {
        return y(d.value);
      })
      .attr("width", x.bandwidth())
      .attr("height", function(d) {
        return actualHeight - y(d.value);
      });

    return div.toReact();
  }
}
