import React from "react";
import { Router } from "react-router-dom";
import createBrowserHistory from "history/createBrowserHistory";

export const customHistory = createBrowserHistory();

const CustomRouter = props => <Router history={customHistory} {...props} />;

export default CustomRouter;
