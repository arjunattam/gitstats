import React from "react";

const GH_SETUP_LINK = "https://github.com/apps/gitstats-dev/installations/new";

const Onboarding = () => {
  return (
    <div>
      <p>Onboarding</p>
      <p>
        <a href={GH_SETUP_LINK}>Github: new installation</a>
      </p>
    </div>
  );
};

export default Onboarding;
