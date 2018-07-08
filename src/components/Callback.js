import React from "react";
import Auth from "../utils/auth";

const auth = new Auth();

const handleAuthentication = (nextState, replace) => {
  if (/access_token|id_token|error/.test(nextState.location.hash)) {
    auth.handleAuthentication();
  }
};

const CallbackPage = props => {
  handleAuthentication(props);
  return (
    <div>
      <p>This is the callback page.</p>
    </div>
  );
};

export default CallbackPage;
