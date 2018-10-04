import createBrowserHistory from "history/createBrowserHistory";
import * as React from "react";
import { Router } from "react-router-dom";
export const customHistory = createBrowserHistory();
import * as GoogleAnalytics from "react-ga";

if (process.env.NODE_ENV !== "development") {
  GoogleAnalytics.initialize("UA-126964714-1");
  GoogleAnalytics.pageview(window.location.pathname + window.location.search);
}

customHistory.listen((location, action) => {
  GoogleAnalytics.set({ page: location.pathname });
  GoogleAnalytics.pageview(location.pathname);
});

const CustomRouter = props => <Router history={customHistory} {...props} />;

export default CustomRouter;
