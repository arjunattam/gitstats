import * as React from "react";
import { Container } from "reactstrap";
import { EmailForm } from "./form";

export const EmailContainer = props => {
  return (
    <Container className="py-5">
      <h3>Track changes every week</h3>
      <div className="my-3">
        Keep an eye on your team's momemtum with weekly email updates.
      </div>

      <EmailForm {...props} />
    </Container>
  );
};
