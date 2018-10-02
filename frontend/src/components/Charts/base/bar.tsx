import * as d3 from "d3";
import * as React from "react";
import * as ReactFauxDOM from "react-faux-dom";
import { getChartWeek } from "../../../utils/date";
import "./index.css";

const MIN_Y_VALUE = 5;

interface IChartDataElement {
  week: string;
  value: number;
}

interface IChartProps {
  color: string;
  selectedColor: string;
  data: IChartDataElement[];
}

interface IChartState {
  selected?: IChartDataElement;
}

const getLabel = (data: IChartDataElement): string => {
  return `Week of ${getChartWeek(data.week)}: ${data.value}`;
};

export class BarChart extends React.Component<IChartProps, IChartState> {
  public state: IChartState = {};

  public render() {
    const div = new ReactFauxDOM.Element("div");
    const { data, color, selectedColor } = this.props;

    const width = 300;
    const height = 100;

    const x = d3
      .scaleBand()
      .rangeRound([0, width])
      .padding(0.3)
      .domain(data.map(d => d.week));

    const y = d3
      .scaleLinear()
      .rangeRound([height, 0])
      .domain([0, d3.max(data, d => Math.max(d.value, MIN_Y_VALUE))]);

    const svg = d3
      .select(div)
      .classed("inline-svg-container", true)
      .classed("ml-3", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const content = svg.append("g").classed("g-content", true);
    content
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("fill", d => {
        const { selected } = this.state;
        const { week } = d;

        if (!!selected && selected.week === week) {
          return selectedColor;
        } else {
          return color;
        }
      })
      .attr("x", d => x(d.week))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.value))
      .on("mousemove", d => {
        const { week } = d;
        const { selected } = this.state;

        if (!selected || selected.week !== week) {
          this.setState({ selected: d });
        }
      })
      .on("mouseout", () => {
        this.setState({ selected: undefined });
      });

    if (!!this.state.selected) {
      const { selected } = this.state;
      const messageText = content
        .append("text")
        .attr("class", "no-pointer-events")
        .attr("y", height * 0.75)
        .attr("transform", `translate(${width * 0.5})`);
      messageText
        .append("tspan")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .text(getLabel(selected));
    }

    return div.toReact();
  }
}
