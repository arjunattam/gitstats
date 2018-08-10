import React from "react";
import { Container } from "reactstrap";
import { ReportContainer } from "../Report";
import {
  MOCK_REPORT_DATA,
  MOCK_PR_DATA,
  MOCK_COMMITS_DATA
} from "../../utils/data";

const Home = () => (
  <div>
    <div className="dark-section darker">
      <Container>
        <div className="px-3 py-5">
          <h3>Lead your engineering team with facts, not feelings</h3>
          <div>Weekly git stats for your GitHub and Bitbucket teams</div>
        </div>
      </Container>
    </div>
    <div>
      <Container>
        <div className="py-5">
          <ReportContainer
            reportJson={MOCK_REPORT_DATA.message}
            prActivityData={MOCK_PR_DATA.message}
            commitsData={MOCK_COMMITS_DATA.message}
          />
        </div>
      </Container>
    </div>
  </div>
);

export default Home;
