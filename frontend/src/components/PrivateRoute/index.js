import React from "react";
import PropTypes from "prop-types";
import { Redirect, Route } from "react-router-dom";
import Auth from "../../utils/auth";

// From: https://github.com/gatsbyjs/gatsby/blob/master/examples/simple-auth/src/components/PrivateRoute.js
const PrivateRoute = ({ component: Component, ...rest }) => {
  const auth = new Auth();
  return (
    <Route
      {...rest}
      render={props =>
        !auth.isAuthenticated() ? (
          <Redirect to={{ pathname: `/` }} />
        ) : (
          <Component {...props} />
        )
      }
    />
  );
};

PrivateRoute.propTypes = {
  component: PropTypes.any.isRequired
};

export default PrivateRoute;
