import React from "react";
import Header from "./Header";
import Home from "./Home";
import Callback from "./Callback";
import PrivateRoute from "./PrivateRoute";
import { Report } from "./Report";
import Router from "./Router";
import Footer from "./Footer";
import { Route } from "react-router-dom";
import "./App.css";

const ReportPage = match => <Report owner={match.params.name} />;

const App = () => (
  <div>
    <Router>
      <div>
        <div className="dark-section">
          <Header />
        </div>
        <div className="light-section">
          <Route exact path="/" component={Home} />
          <Route path="/callback" component={Callback} />
          <PrivateRoute path="/report/:name" component={ReportPage} />
        </div>
      </div>
    </Router>
    <div className="dark-section darker">
      <Footer />
    </div>
  </div>
);

export default App;
