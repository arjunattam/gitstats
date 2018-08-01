import React from "react";
import ReactFauxDOM from "react-faux-dom";
import * as d3 from "d3";
import { addXAxis } from "./utils";
import "./index.css";

const INTERVAL_SIZE = 4; // hours
const MIN_Y = 3;
const LEGEND_PADDING = 40;

const PR_COLORS = {
  commit: "#ff31317d",
  pr_comment: "#5252b97d"
};

const STREAM_COLOR_RANGE = {
  commit: "#fee08b",
  pr_comment: "#3288bd"
};

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};

const addLegend = (svg, width, colorMap) => {
  // Add legend
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

export class Streamgraph extends React.Component {
  state = {
    hoverX: null,
    hoverType: null
  };

  getRoundedDate = date => {
    const parsed = new Date(date);
    parsed.setUTCSeconds(0);
    parsed.setUTCMilliseconds(0);
    parsed.setUTCMinutes(0);
    parsed.setUTCHours(
      parsed.getUTCHours() - (parsed.getUTCHours() % INTERVAL_SIZE)
    );
    const lower = new Date(parsed);
    const upper = new Date(lower).addHours(4);
    const d = new Date(date);
    const sorted = [lower, upper].sort((a, b) => {
      const distanceA = Math.abs(d.getTime() - a.getTime());
      const distanceB = Math.abs(d.getTime() - b.getTime());
      return distanceA - distanceB;
    });
    return sorted[0];
  };

  parseHelper(data, startDate, endDate) {
    let result = [];

    data.forEach(layer => {
      let layerType;

      if (layer.length) {
        layerType = layer[0].type;
      }

      const layerData = layer.reduce((acc, current) => {
        const copy = this.getRoundedDate(current.x);
        acc[copy] = copy in acc ? [...acc[copy], current] : [current];
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

        const contents = j in layerData ? layerData[j] : [];
        layerResult.push({
          x: new Date(j),
          y: { start, end: start + contents.length },
          contents,
          type: layerType
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
    }, MIN_Y);
  }

  getHoverContent = data => {
    const { hoverX, hoverType } = this.state;

    const selectedType = data.filter(layerData => {
      return layerData.length && layerData[0].type === hoverType;
    });

    if (selectedType.length) {
      const hoverLayer = selectedType[0];
      const filtered = hoverLayer.filter(
        item => item.x.getTime() === hoverX.getTime()
      );

      if (filtered.length) {
        return filtered[0].contents;
      }
    }

    return [];
  };

  render() {
    const div = new ReactFauxDOM.Element("div");
    const { startDate, endDate } = this.props;
    const data = this.parsedData();
    const prevData = this.parsedPrevData();
    const maxY = this.getMaxY([...data, ...prevData]);
    const hoverContents = this.getHoverContent(data);

    var width = 600;
    var height = 150 + LEGEND_PADDING;
    var margin = 20;
    var actualHeight = height - margin - LEGEND_PADDING;
    var actualWidth = width - 2 * margin;

    let svg = d3
      .select(div)
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .classed("svg-content-responsive", true);

    var x = d3
      .scaleTime()
      .domain([startDate, endDate])
      .range([margin, margin + actualWidth]);

    var y = d3
      .scaleLinear()
      .domain([0, maxY + 2])
      .range([actualHeight, 0]);

    addLegend(svg, width, STREAM_COLOR_RANGE);

    // Chart content
    var content = svg
      .append("g")
      .classed("g-content", true)
      .attr("transform", `translate(0,${LEGEND_PADDING})`);

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

    content
      .append("g")
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", area)
      .attr("fill", d => {
        if (d.length) {
          const layerType = d[0].type;
          const { hoverType } = this.state;
          const isAlpha = hoverType && hoverType !== layerType;
          const alpha = isAlpha ? "9d" : "";
          const baseColor = STREAM_COLOR_RANGE[layerType];
          return `${baseColor}${alpha}`;
        }
      })
      .on("mousemove", d => {
        const CONTENT_SELECTOR = "g.g-content";
        const node = d3.select(CONTENT_SELECTOR).node();
        const mouse = d3.mouse(node);
        const inverted = x.invert(mouse[0]);
        const xTime = this.getRoundedDate(inverted);
        const data = d.filter(item => item.x.getTime() === xTime.getTime());
        let hoverType;

        if (data.length) {
          hoverType = data[0].type;
        }

        this.setState({ hoverX: xTime, hoverType });
      })
      .on("mouseout", () => {
        this.setState({ hoverX: null, hoverType: null });
      });

    // Plot hover line
    if (this.state.hoverX) {
      content
        .append("line")
        .attr("stroke", "#fff")
        .attr("stroke-width", "1")
        .attr("class", "no-pointer-events")
        .attr("y1", y(0))
        .attr("y2", y(maxY))
        .attr("x1", x(this.state.hoverX))
        .attr("x2", x(this.state.hoverX));
    }

    // Plot hover contents
    if (hoverContents.length > 0) {
      const text = hoverContents
        .filter(item => !!item.message)
        .map(item => item.message);

      if (text.length) {
        const trimmed = text.slice(0, 5).map(d => `· ${d}`);

        if (trimmed.length < text.length) {
          const diff = text.length - trimmed.length;
          trimmed.push(`and ${diff} more...`);
        }

        var messageText = content.append("text").attr("class", "message-text");

        messageText
          .selectAll("tspan")
          .data(trimmed)
          .enter()
          .append("tspan")
          .attr("x", "25")
          .attr("y", (d, i) => `${1.4 * i}em`)
          .text(d => d);
      }
    }

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

    content
      .append("g")
      .selectAll("path")
      .data(prevData)
      .enter()
      .append("path")
      .attr("d", line)
      .attr("class", "no-pointer-events")
      .attr("stroke", "#cec1b5")
      .attr("stroke-width", "1")
      .attr("stroke-dasharray", "5,2")
      .attr("fill", "none");

    addXAxis(content, startDate, endDate, x, actualHeight);

    var yAxis = d3.axisLeft(y).ticks(2);
    content
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
      .attr("fill", PR_COLORS.pr_comment);

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
      .attr("fill", PR_COLORS.commit);

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

    addLegend(svg, width, PR_COLORS);

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
