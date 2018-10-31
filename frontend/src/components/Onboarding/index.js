import React from "react";
import { Container } from "reactstrap";

const GH_SETUP_LINK = "https://github.com/apps/gitstats-dev/installations/new";

const Onboarding = () => {
  return (
    <Container className="py-5">
      <h3>Onboarding</h3>
      <ul>
        <li>For Bitbucket: teams are fetched via API</li>
        <li>
          For Github: <a href={GH_SETUP_LINK}>add new installation</a>
        </li>
      </ul>
    </Container>
  );
};

export default Onboarding;
