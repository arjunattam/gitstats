import React from "react";
import { Container } from "reactstrap";
import { Report } from "../Report";

const SENTRY_OWNER_NAME = "getsentry";

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
          <Report owner={SENTRY_OWNER_NAME} />
        </div>
      </Container>
    </div>
  </div>
);

export default Home;
