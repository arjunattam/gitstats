import React from "react";
import ReactFauxDOM from "react-faux-dom";
import * as d3 from "d3";
import "./index.css";

const INTERVAL_SIZE = 4; // hours

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
      .domain([0, maxY + 2]) // TODO: calculate this
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

    let xTicks = [];
    for (let i = new Date(startDate); i <= endDate; i = i.addHours(12)) {
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
      return d.getUTCHours() === 12 ? 0 : 6;
    });

    var yAxis = d3.axisLeft(y).ticks(2);
    svg
      .append("g")
      .attr("transform", `translate(${margin},0)`)
      .call(yAxis);

    return div.toReact();
  }
}

export class PRActivity extends React.Component {
  renderPR(prData, svg, x, y, axisEnd, yValue) {
    const { created_at, merged_at, commits, comments } = prData;

    // Plot area
    var areaEnd = merged_at ? new Date(merged_at) : axisEnd;
    var areaWidth = x(areaEnd) - x(new Date(created_at));
    svg
      .append("g")
      .append("rect")
      .attr("x", x(new Date(created_at)))
      .attr("y", y(yValue + 1.25))
      .attr("width", areaWidth)
      .attr("height", 15)
      .attr("fill", "#ddd");

    // Plot comments
    svg
      .append("g")
      .selectAll("scatter-dots")
      .data(comments.map(c => [c.date, yValue + 1]))
      .enter()
      .append("svg:circle")
      .attr("cx", function(d, i) {
        return x(new Date(d[0]));
      })
      .attr("cy", function(d) {
        return y(d[1]);
      })
      .attr("r", 2)
      .attr("fill", "blue");

    // Plot commits
    svg
      .append("g")
      .selectAll("scatter-dots")
      .data(commits.map(c => [c.date, yValue + 1]))
      .enter()
      .append("svg:circle")
      .attr("cx", function(d, i) {
        return x(new Date(d[0]));
      })
      .attr("cy", function(d) {
        return y(d[1]);
      })
      .attr("r", 2)
      .attr("fill", "red");
  }

  render() {
    if (!this.props.data || !this.props.data.length) return null;

    const data = this.props.data[0].pulls;
    // TODO - calcualate start time
    const axisStart = d3.utcSunday(new Date("2018-07-24T00:00:00Z"));
    const axisEnd = d3.timeDay.offset(axisStart, 7);

    var width = 600;
    var height = 150;
    var margin = 20;
    var actualHeight = height - margin;
    var actualWidth = width - 2 * margin;

    var x = d3
      .scaleLinear()
      .domain([axisStart, axisEnd])
      .range([margin, margin + actualWidth]);

    var y = d3
      .scaleLinear()
      .domain([0, 5]) // TODO: calculate this
      .range([actualHeight, 0]);

    const div = new ReactFauxDOM.Element("div");

    let svg = d3
      .select(div)
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 600 200")
      .classed("svg-content-responsive", true);

    data
      .filter(pr => new Date(pr.created_at) < axisEnd)
      .filter(pr => pr.state === "MERGED")
      .forEach((prData, index) => {
        this.renderPR(prData, svg, x, y, axisEnd, index);
      });

    var formatTime = d3.timeFormat("%b %d");
    var axis = d3.axisBottom(x).tickFormat(formatTime);
    svg
      .append("g")
      .attr("transform", `translate(0,${actualHeight})`)
      .call(axis);

    return div.toReact();
  }
}
