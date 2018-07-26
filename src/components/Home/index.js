import React from "react";
import { Container } from "reactstrap";
import { ReportContainer } from "../Report";
import { MOCK_REPORT_DATA } from "../../utils/data";

const Home = () => (
  <Container>
    <div className="m-3">
      <p className="lead">
        Git stats to <strong>track your engineering momentum</strong>. See
        example.
      </p>
    </div>
    <div className="my-4">
      <ReportContainer {...MOCK_REPORT_DATA.message} />
    </div>
  </Container>
);

export default Home;
