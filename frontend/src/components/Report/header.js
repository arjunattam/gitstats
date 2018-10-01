import React from "react";
import { Container } from "reactstrap";
import { TeamName } from "../Common";
import { getWeek, getLabels } from "../../utils/date";

const ExpandedDateLabel = ({ input }) => {
  const { day, date } = getLabels(input);
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
    <div className="h4 my-0">
      <ExpandedDateLabel input={start} />
      <span className="small font-italic text-muted mx-2">to</span>
      <ExpandedDateLabel input={end} />
    </div>
  );
};

export const Header = ({ team, weekStart }) => {
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center my-3">
        <TeamName {...team} />
        <RangeLabel {...getWeek(weekStart)} />
      </div>
    </Container>
  );
};
