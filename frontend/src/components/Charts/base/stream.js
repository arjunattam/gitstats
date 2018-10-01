import React from "react";
import PropTypes from "prop-types";
import ReactFauxDOM from "react-faux-dom";
import * as d3 from "d3";
import { COLORS, LEGEND_PADDING, addLegend, addXAxis } from "./utils";
import "./index.css";
import { plusHours } from "../../../utils/date";

const INTERVAL_SIZE = 4; // hours
const MIN_Y = 3;

export class Streamgraph extends React.Component {
  static propTypes = {
    startDate: PropTypes.instanceOf(Date).isRequired,
    endDate: PropTypes.instanceOf(Date).isRequired,
    data: PropTypes.array.isRequired,
    prevData: PropTypes.array.isRequired
  };

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
    const upper = plusHours(lower, 4);
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

      for (let i = copyStart; i <= copyEnd; i = plusHours(i, INTERVAL_SIZE)) {
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
    var margin = 25;
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

    addLegend(svg, width, COLORS);

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
          const baseColor = COLORS[layerType];
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
          .attr("x", `${margin + 5}`)
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
      .attr("stroke", "#333")
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
