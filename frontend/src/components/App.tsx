import * as React from "react";
import { Route } from "react-router-dom";
import * as actions from "../actions";
import store from "../store";
import "./App.css";
import Footer from "./Footer";
import Home from "./Home";
import Header from "./Navigation";
import Onboarding from "./Onboarding";
import PrivateRoute from "./PrivateRoute";
import { ReportPage } from "./Report";
import Router from "./Router";

class App extends React.Component<{}, {}> {
  public componentDidMount() {
    store.dispatch(actions.initializeAuth());
  }

  public render() {
    return (
      <div>
        <Router>
          <div>
            <div className="dark-section">
              <Header />
            </div>
            <div className="light-section">
              <Route exact={true} path="/" component={Home} />
              <PrivateRoute path="/report/:name" component={ReportPage} />
              <PrivateRoute path="/setup" component={Onboarding} />
            </div>
          </div>
        </Router>
        <div className="dark-section darker">
          <Footer />
        </div>
      </div>
    );
  }
}

export default App;
