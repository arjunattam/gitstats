import React from "react";
import ReactFauxDOM from "react-faux-dom";
import * as d3 from "d3";
import "./index.css";

export class Sparkline extends React.Component {
  render() {
    const div = new ReactFauxDOM.Element("div");
    div.setAttribute("class", "sparkline-container");

    const { data } = this.props;
    data.forEach(d => {
      d.week = +d.week;
    });

    var gradientColors = ["green", "orange", "red"];
    const width = 100;
    const height = 20;
    const margin = 2;
    var actualHeight = height - margin;

    var x = d3
      .scaleLinear()
      .rangeRound([0, width])
      .domain([d3.min(data.map(d => d.week)), d3.max(data.map(d => d.week))]);

    var y = d3
      .scaleLinear()
      .rangeRound([actualHeight, margin])
      .domain([
        0,
        d3.max(data, function(d) {
          return d.value;
        })
      ]);

    let svg = d3
      .select(div)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    var valueline = d3
      .line()
      .x(function(d) {
        return x(+d.week);
      })
      .y(function(d) {
        return y(d.value);
      });

    let gradient;
    if (gradientColors && gradientColors.length) {
      // this defines the gradient used
      gradient = svg
        .append("defs")
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%") // starting x point
        .attr("y1", "0%") // starting y point
        .attr("x2", "0%") // ending x point
        .attr("y2", "100%") // ending y point
        .attr("spreadMethod", "pad");

      gradientColors.forEach(function(color, index) {
        gradient
          .append("stop")
          .attr("offset", (index * 100) / gradientColors.length + "%")
          .attr("stop-color", color)
          .attr("stop-opacity", 0.7);
      });
    }

    svg
      .append("path")
      .datum(data)
      .attr("d", valueline)
      .attr("fill", "none")
      .attr("stroke-width", 3)
      .attr("stroke", function() {
        if (gradient) {
          return "url(#gradient)";
        }
        return "#444444";
      });

    return div.toReact();
  }
}
