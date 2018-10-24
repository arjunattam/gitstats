import { IWeekValue } from "gitstats-shared";
import * as React from "react";
import { Row } from "reactstrap";
import { getDurationLabel } from "../../../utils/date";
import { TextColWrapper, ValueColWrapper } from "../common";

interface IValueDataPoint {
  next: number | string;
  previous: number | string;
  chartData?: IWeekValue[];
}

interface IPullsRowProps {
  prsOpened: IValueDataPoint;
  prsMerged: IValueDataPoint;
  prsReviewed: IValueDataPoint;
  activeReviewer: IValueDataPoint;
  medianMergeTimes: IValueDataPoint;
  medianCommentTimes: IValueDataPoint;
  isLoading: boolean;
}

export const PullsRow: React.SFC<IPullsRowProps> = ({
  prsOpened,
  prsMerged,
  prsReviewed,
  activeReviewer,
  medianMergeTimes,
  medianCommentTimes,
  isLoading
}) => {
  return (
    <div className="my-2">
      <Row>
        <ValueColWrapper {...prsOpened} title={"PRs opened"} />
        <ValueColWrapper {...prsReviewed} title={"PRs reviewed"} />
        <ValueColWrapper {...prsMerged} title={"PRs merged"} />
      </Row>
      <Row>
        <TextColWrapper {...activeReviewer} title={"Most active reviewer"} />
        <ValueColWrapper
          {...medianCommentTimes}
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
