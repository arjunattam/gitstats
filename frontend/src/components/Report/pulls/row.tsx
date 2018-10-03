import * as React from "react";
import { Row } from "reactstrap";
import { TextColWrapper, ValueColWrapper } from "../common";

interface IValueDataPoint {
  next: number | string;
  previous: number | string;
  chartData?: IWeekValues[];
}

interface IPullsRowProps {
  prsOpened: IValueDataPoint;
  prsMerged: IValueDataPoint;
  prComments: IValueDataPoint;
  isLoading: boolean;
}

export const PullsRow: React.SFC<IPullsRowProps> = ({
  prsOpened,
  prsMerged,
  prComments,
  isLoading
}) => {
  return (
    <div className="my-2">
      <Row>
        <ValueColWrapper {...prsOpened} title={"PRs opened"} />
        <ValueColWrapper {...prsMerged} title={"PRs merged"} />
        <ValueColWrapper {...prComments} title={"PR Comments"} />
      </Row>
      <Row />
    </div>
  );
};
