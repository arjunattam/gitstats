import React from "react";
import PropTypes from "prop-types";
import { Redirect, Route } from "react-router-dom";
import { isAuthenticated } from "../../utils/auth";

// From: https://github.com/gatsbyjs/gatsby/blob/master/examples/simple-auth/src/components/PrivateRoute.js
const PrivateRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props =>
        !isAuthenticated() ? (
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
