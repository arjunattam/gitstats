import { getDateLabels, IPeriod, ITeam } from "gitstats-shared";
import * as React from "react";
import { Container } from "reactstrap";
import { TeamName } from "../Common";

const ExpandedDateLabel = ({ input }) => {
  const { day, date } = getDateLabels(input);
  return (
    <span>
      <span className="text-muted">{day}</span>
      {", "}
      <span>{date}</span>
    </span>
  );
};

const RangeLabel = ({ start, end }) => {
  return (
    <div className="h4 my-2">
      <ExpandedDateLabel input={start} />
      <span className="small font-italic text-muted mx-2">to</span>
      <ExpandedDateLabel input={end} />
    </div>
  );
};

interface IHeaderProps {
  period: IPeriod;
  team: ITeam;
}

export class Header extends React.Component<IHeaderProps, {}> {
  public render() {
    const { team, period } = this.props;
    return (
      <Container>
        <div className="d-flex justify-content-between align-items-center flex-wrap pt-4">
          <TeamName {...team} />
          <RangeLabel {...period.current} />
        </div>
      </Container>
    );
  }
}
