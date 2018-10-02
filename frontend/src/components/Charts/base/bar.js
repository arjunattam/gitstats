import React from "react";
import ReactFauxDOM from "react-faux-dom";
import * as d3 from "d3";
import { COLORS } from "./utils";
import "./index.css";

export class BarChart extends React.Component {
  render() {
    const div = new ReactFauxDOM.Element("div");
    const { data } = this.props;

    const MIN_Y_VALUE = 5;
    var width = 600;
    var height = 200;
    var margin = 0;
    var actualHeight = height - margin;
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
      .classed("inline-svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`);

    var content = svg.append("g").classed("g-content", true);

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
