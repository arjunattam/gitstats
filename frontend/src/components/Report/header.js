import React from "react";
import { Container } from "reactstrap";
import { TeamName } from "../Common";
import { getWeekLabel } from "../../utils/date";

export const Header = ({ team, weekStart }) => {
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center my-3">
        <TeamName {...team} />

        <div>{getWeekLabel(weekStart)}</div>
      </div>
    </Container>
  );
};
