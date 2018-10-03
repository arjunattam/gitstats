import * as React from "react";
import { Container } from "reactstrap";
import { getUserProfile } from "../../../utils/auth";
import { EmailForm } from "./form";

export const EmailContainer = props => {
  const { email } = getUserProfile();

  return (
    <Container className="py-5">
      <h3>Track changes every week</h3>
      <div className="my-3">
        Keep an eye on your team's momentum with weekly email updates.
      </div>

      <EmailForm {...props} defaultEmail={email} />
    </Container>
  );
};
