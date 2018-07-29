import React from "react";
import ReactFauxDOM from "react-faux-dom";
import * as d3 from "d3";
import { addXAxis } from "./utils";
import "./index.css";

const INTERVAL_SIZE = 4; // hours
const COMMIT_CIRCLE_COLOR = "#ff31317d";
const COMMENT_CIRCLE_COLOR = "#5252b97d";

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};

export class Streamgraph extends React.Component {
  // data props looks like
  // [
  //    [ {x: date1, y: 1}, {x: date2, y: 1} ], --> layer 1
  //    [ {x: date1, y: 1}, {x: date2, y: 1} ]  --> layer 2
  // ]
  parseHelper(data, startDate, endDate) {
    let result = [];
    data.forEach(layer => {
      const layerData = layer.reduce((acc, current) => {
        const parsed = new Date(current.x);
        parsed.setUTCSeconds(0);
        parsed.setUTCMilliseconds(0);
        parsed.setUTCMinutes(0);
        parsed.setUTCHours(
          parsed.getUTCHours() - (parsed.getUTCHours() % INTERVAL_SIZE)
        );
        const copy = new Date(parsed);

        if (copy in acc) {
          acc[copy] = acc[copy] + 1;
        } else {
          acc[copy] = 1;
        }
        return acc;
      }, {});

      let layerResult = [];

      // Get y-start from previous
      // for stacking behavior
      let previous = [];
      if (result.length > 0) {
        previous = result[result.length - 1];
      }

      const copyStart = new Date(startDate);
      const copyEnd = new Date(endDate);

      for (let i = copyStart; i <= copyEnd; i = i.addHours(INTERVAL_SIZE)) {
        const j = new Date(i);
        let start = 0;

        if (previous) {
          const filtered = previous.filter(p => p.x.getTime() === j.getTime());
          if (filtered.length > 0) {
            start = filtered[0].y.end;
          }
        }

        layerResult.push({
          x: new Date(j),
          y: { start, end: j in layerData ? start + layerData[j] : start }
        });
      }

      result.push(layerResult);
    });

    return result;
  }

  parsedData() {
    const { data, startDate, endDate } = this.props;
    return this.parseHelper(data, startDate, endDate);
  }

  parsedPrevData() {
    const { prevData, startDate } = this.props;
    const copy = new Date(startDate);
    const prevStart = new Date(copy.setDate(copy.getDate() - 7));
    const prevEnd = new Date(startDate);
    const result = this.parseHelper(prevData, prevStart, prevEnd);

    // Add 7 days to result so that we can use the x-axis
    return result.map(resultLayer => {
      return resultLayer.map(data => {
        return { ...data, x: new Date(data.x.setDate(data.x.getDate() + 7)) };
      });
    });
  }

  getMaxY(data) {
    let flattened = [];
    data.forEach(layer => flattened.push(...layer));

    return flattened.reduce((acc, curr) => {
      return Math.max(acc, curr.y.end);
    }, 10);
  }

  render() {
    const div = new ReactFauxDOM.Element("div");
    const { startDate, endDate } = this.props;
    const data = this.parsedData();
    const prevData = this.parsedPrevData();
    const maxY = this.getMaxY([...data, ...prevData]);

    var width = 600;
    var height = 150;
    var margin = 20;
    var actualHeight = height - margin;
    var actualWidth = width - 2 * margin;

    let svg = d3
      .select(div)
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .classed("svg-content-responsive", true);

    var colorrange = [
      // "#d53e4f",
      // "#f46d43",
      // "#fdae61"
      "#fee08b"
      // "#e6f598"
      // "#abdda4"
      // "#66c2a5",
      // "#3288bd"
      // "#5e4fa2"
    ];

    var x = d3
      .scaleTime()
      .domain([startDate, endDate])
      .range([margin, margin + actualWidth]);

    var y = d3
      .scaleLinear()
      .domain([0, maxY + 2])
      .range([actualHeight, 0]);

    var area = d3
      .area()
      .curve(d3.curveMonotoneX)
      .x(function(d) {
        return x(d.x);
      })
      .y0(function(d) {
        return y(d.y.start);
      })
      .y1(function(d) {
        return y(d.y.end);
      });

    svg
      .append("g")
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", area)
      .attr("fill", function(d, i) {
        return colorrange[i % colorrange.length];
      })
      .on("mouseover", function(d, i) {
        // console.log("mouse over", d, i);
      });

    // Plot previous data - with no fill
    var line = d3
      .line()
      .curve(d3.curveMonotoneX)
      .x(function(d) {
        return x(d.x);
      })
      .y(function(d) {
        return y(d.y.end);
      });

    svg
      .append("g")
      .selectAll("path")
      .data(prevData)
      .enter()
      .append("path")
      .attr("d", line)
      .attr("stroke", "#fdae61")
      .attr("stroke-width", "1")
      .attr("stroke-dasharray", "5,2")
      .attr("fill", "none");

    addXAxis(svg, startDate, endDate, x, actualHeight);

    var yAxis = d3.axisLeft(y).ticks(2);
    svg
      .append("g")
      .attr("transform", `translate(${margin},0)`)
      .call(yAxis);

    return div.toReact();
  }
}

export class PRActivity extends React.Component {
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
      .attr("fill", COMMENT_CIRCLE_COLOR);

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
      .attr("fill", COMMIT_CIRCLE_COLOR);

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

  renderLegend(svg) {
    svg
      .append("svg:circle")
      .attr("r", 3)
      .attr("fill", COMMIT_CIRCLE_COLOR);

    svg
      .append("text")
      .attr("x", "5")
      .attr("y", "2.5")
      .text("Commits");

    svg
      .append("svg:circle")
      .attr("r", 3)
      .attr("cx", "50")
      .attr("fill", COMMENT_CIRCLE_COLOR);

    svg
      .append("text")
      .attr("x", "55")
      .attr("y", "2.5")
      .text("Comments");
  }

  render() {
    if (!this.props.data) return null;

    const { data, startDate, endDate } = this.props;
    const count = data.length;
    const MIN_COUNT = 2;

    const axisStart = new Date(startDate);
    const axisEnd = new Date(endDate);

    const LEGEND_PADDING = 40;
    var width = 600;
    var height = 30 * Math.max(MIN_COUNT, count) + LEGEND_PADDING;
    var margin = 20;
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

    // Add legend
    var legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width / 2 - 40},${LEGEND_PADDING / 2})`);

    this.renderLegend(legend);

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
