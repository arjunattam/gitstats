import * as React from "react";
import { Row } from "reactstrap";
import { getDurationLabel } from "../../../utils/date";
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
  medianMergeTimes: IValueDataPoint;
  isLoading: boolean;
}

export const PullsRow: React.SFC<IPullsRowProps> = ({
  prsOpened,
  prsMerged,
  prComments,
  medianMergeTimes,
  isLoading
}) => {
  return (
    <div className="my-2">
      <Row>
        <ValueColWrapper {...prsOpened} title={"PRs opened"} />
        <ValueColWrapper {...prComments} title={"PRs reviewed"} />
        <ValueColWrapper {...prsMerged} title={"PRs merged"} />
      </Row>
      <Row>
        <TextColWrapper {...prComments} title={"Most active reviewer"} />
        <ValueColWrapper
          {...prComments}
          title={"Median time to first comment"}
          transformer={getDurationLabel}
        />
        <ValueColWrapper
          {...medianMergeTimes}
          title={"Median time to merge"}
          transformer={getDurationLabel}
        />
      </Row>
    </div>
  );
};
