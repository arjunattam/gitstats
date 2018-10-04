import * as d3 from "d3";
import * as React from "react";
import * as ReactFauxDOM from "react-faux-dom";
import "./index.css";

const MIN_Y_VALUE = 4;

interface IChartDataElement {
  week: string;
  value: number;
}

interface IChartProps {
  xAxisTitle: string;
  color: string;
  textColor: string;
  data: IChartDataElement[];
}

export class BarChart extends React.Component<IChartProps, {}> {
  public render() {
    const div = new ReactFauxDOM.Element("div");
    const { data, color, textColor, xAxisTitle } = this.props;

    const width = 300;
    const TEXT_PADDING = 14;
    const height = 100;
    const actualHeight = height - 2 * TEXT_PADDING;

    const x = d3
      .scaleBand()
      .rangeRound([0, width])
      .padding(0.3)
      .domain(data.map(d => d.week));

    const y = d3
      .scaleLinear()
      .rangeRound([actualHeight, 0])
      .domain([0, d3.max(data, d => Math.max(d.value, MIN_Y_VALUE))]);

    const svg = d3
      .select(div)
      .classed("inline-svg-container", true)
      .classed("ml-3", true) // Bootstrap margin left
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const content = svg
      .append("g")
      .classed("g-content", true)
      .attr("transform", `translate(0,${TEXT_PADDING})`);
    content
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("fill", color)
      .attr("x", d => x(d.week))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => actualHeight - y(d.value));

    content
      .selectAll(".label-text")
      .data(data)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("class", "label")
      .attr("x", d => x(d.week) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 2)
      .text(d => d.value || "0");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .attr("transform", `translate(${width / 2},${height - 1})`)
      .text(xAxisTitle);

    return div.toReact();
  }
}
