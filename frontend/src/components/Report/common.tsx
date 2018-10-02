import * as React from "react";
import { Col } from "reactstrap";
import { BarChart } from "../Charts/base/bar";
import { getChange } from "./utils";

const BaseValueCol = ({ children }) => {
  return <Col className="border py-3">{children}</Col>;
};

const BaseValueTitle = ({ children }) => {
  return <div className="text-muted small text-uppercase">{children}</div>;
};

const ValueCol = ({ title, value, summaryText }) => {
  return (
    <BaseValueCol>
      <BaseValueTitle>{title}</BaseValueTitle>
      <div className="h3 my-1">{value}</div>
      <div>{summaryText}</div>
    </BaseValueCol>
  );
};

const ValueColWithChart = ({ title, value, summaryText, chartData }) => {
  const BASE_COLOR = `#ffb154`;
  const ALPHA_COLOR = `${BASE_COLOR}60`;
  return (
    <BaseValueCol>
      <BaseValueTitle>{title}</BaseValueTitle>
      <div className="d-flex justify-content-between">
        <div>
          <div className="h3 my-1">{value}</div>
          <div className="text-nowrap">{summaryText}</div>
        </div>
        <BarChart
          data={chartData}
          color={ALPHA_COLOR}
          selectedColor={BASE_COLOR}
        />
      </div>
    </BaseValueCol>
  );
};

interface IValueColProps {
  title: string;
  previous: string | number;
  next: string | number;
  chartData?: any;
}

export const ValueColWrapper: React.SFC<IValueColProps> = ({
  title,
  previous,
  next,
  chartData
}) => {
  const { isInfinity, value, direction } = getChange(previous, next);
  let summaryText;
  let miniSummary;

  if (isInfinity) {
    summaryText = "Big jump over last week";
    miniSummary = "↑ ∞";
  } else {
    if (direction === "up") {
      summaryText = `↑ ${value}% over last week`;
      miniSummary = `↑ ${value}%`;
    } else if (direction === "down") {
      summaryText = `↓ ${value}% from last week`;
      miniSummary = `↓ ${value}%`;
    }
  }

  if (!!chartData) {
    return (
      <ValueColWithChart
        title={title}
        value={next}
        summaryText={miniSummary}
        chartData={chartData}
      />
    );
  } else {
    return <ValueCol title={title} value={next} summaryText={summaryText} />;
  }
};

export const TextColWrapper = ({ title, previous, next }) => {
  let summaryText;
  if (!!next && !!previous) {
    if (previous === next) {
      summaryText = "Same as last week";
    } else {
      summaryText = `Last week it was ${previous}`;
    }
  }
  return <ValueCol title={title} value={next} summaryText={summaryText} />;
};
