import React from "react";
import { Container } from "reactstrap";

const GH_SETUP_LINK = "https://github.com/apps/gitstats-dev/installations/new";

const Onboarding = () => {
  return (
    <Container className="py-5">
      <p>Onboarding</p>
      <p>
        <a href={GH_SETUP_LINK}>Github: new installation</a>
      </p>
    </Container>
  );
};

export default Onboarding;
