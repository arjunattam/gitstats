import * as React from "react";
import { Container } from "reactstrap";
import { Report } from "../Report/report";

const SENTRY_TEAM = {
  avatar: "https://avatars0.githubusercontent.com/u/1396951?v=4",
  login: "getsentry",
  name: "Sentry",
  service: "github"
};

const Home = () => (
  <div>
    <div className="dark-section darker">
      <Container className="py-5">
        <h3>Lead your engineering team with facts, not feelings</h3>
        <div className="py-1">
          Weekly git stats for your GitHub and Bitbucket teams
        </div>
      </Container>
    </div>
    <Report team={SENTRY_TEAM} teamLogin={SENTRY_TEAM.login} />
  </div>
);

export default Home;
