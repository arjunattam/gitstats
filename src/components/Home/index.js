import React from "react";
import { Container } from "reactstrap";
import { ReportContainer } from "../Report";
import { MOCK_DATA } from "../../utils/data";

const Home = () => (
  <Container>
    <div className="m-3">
      <p className="lead">
        Simple git stats to <strong>track your engineering momentum</strong>.
      </p>
    </div>
    <div className="my-4">
      <ReportContainer {...MOCK_DATA.message} />
    </div>
  </Container>
);

export default Home;
