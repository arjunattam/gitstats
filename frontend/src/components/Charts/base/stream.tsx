import * as d3 from "d3";
import * as React from "react";
import * as ReactFauxDOM from "react-faux-dom";
import { plusHours } from "../../../utils/date";
import "./index.css";
import { addLegend, addXAxis, COLORS, LEGEND_PADDING } from "./utils";

const INTERVAL_SIZE = 4; // hours
const MIN_Y = 3;

interface IStreamgraphProps {
  startDate: Date;
  endDate: Date;
  data: any[];
  prevData: any[];
}

interface IStreamgraphState {
  hoverX: any;
  hoverType: any;
}

export class Streamgraph extends React.Component<
  IStreamgraphProps,
  IStreamgraphState
> {
  public state = {
    hoverType: null,
    hoverX: null
  };

  public render() {
    const div = new ReactFauxDOM.Element("div");
    const { startDate, endDate } = this.props;
    const data = this.parsedData();
    const prevData = this.parsedPrevData();
    const maxY = this.getMaxY([...data, ...prevData]);
    const hoverContents = this.getHoverContent(data);

    const width = 600;
    const height = 150 + LEGEND_PADDING;
    const margin = 20;
    const actualHeight = height - margin - LEGEND_PADDING;
    const actualWidth = width - 2 * margin;

    const svg = d3
      .select(div)
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .classed("svg-content-responsive", true);
    const x = d3
      .scaleTime()
      .domain([startDate, endDate])
      .range([margin, margin + actualWidth]);
    const y = d3
      .scaleLinear()
      .domain([0, maxY + 2])
      .range([actualHeight, 0]);

    addLegend(svg, width, COLORS);

    // Chart content
    const content = svg
      .append("g")
      .classed("g-content", true)
      .attr("transform", `translate(0,${LEGEND_PADDING})`);

    const area = d3
      .area()
      .curve(d3.curveMonotoneX)
      .x((d: any) => x(d.x))
      .y0((d: any) => y(d.y.start))
      .y1((d: any) => y(d.y.end));

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
        const node: any = d3.select(CONTENT_SELECTOR).node();
        const mouse: any = d3.mouse(node);
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
        const messageText = content
          .append("text")
          .attr("class", "message-text");
        messageText
          .selectAll("tspan")
          .data(trimmed)
          .enter()
          .append("tspan")
          .attr("x", `${margin + 5}`)
          .attr("y", (d, i) => `${1.4 * i}em`)
          .text((d: any) => d);
      }
    }

    // Plot previous data - with no fill
    const line = d3
      .line()
      .curve(d3.curveMonotoneX)
      .x((d: any) => x(d.x))
      .y((d: any) => y(d.y.end));
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

    const yAxis = d3.axisLeft(y).ticks(2);
    content
      .append("g")
      .attr("transform", `translate(${margin},0)`)
      .call(yAxis);
    return div.toReact();
  }

  private getRoundedDate = date => {
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

  private parseHelper(data, startDate, endDate) {
    const result = [];

    data.forEach(layer => {
      let layerType;
      if (layer.length) {
        layerType = layer[0].type;
      }

      const layerData = layer.reduce((acc, current) => {
        const rounded = this.getRoundedDate(current.x);
        const copy = rounded.toString();
        acc[copy] = copy in acc ? [...acc[copy], current] : [current];
        return acc;
      }, {});

      const layerResult = [];

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

        const jString = j.toString();
        const contents = jString in layerData ? layerData[jString] : [];

        layerResult.push({
          contents,
          type: layerType,
          x: new Date(j),
          y: { start, end: start + contents.length }
        });
      }

      result.push(layerResult);
    });
    return result;
  }

  private parsedData() {
    const { data, startDate, endDate } = this.props;
    return this.parseHelper(data, startDate, endDate);
  }

  private parsedPrevData() {
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

  private getMaxY(data) {
    const flattened = [];
    data.forEach(layer => flattened.push(...layer));
    return flattened.reduce((acc, curr) => {
      return Math.max(acc, curr.y.end);
    }, MIN_Y);
  }

  private getHoverContent = data => {
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
}
