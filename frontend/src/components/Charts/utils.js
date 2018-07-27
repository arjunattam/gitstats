import * as d3 from "d3";

export const addXAxis = (svg, startDate, endDate, x, actualHeight) => {
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
};
