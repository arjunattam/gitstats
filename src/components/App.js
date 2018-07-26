import React from "react";
import Header from "./Header";
import Home from "./Home";
import Callback from "./Callback";
import PrivateRoute from "./PrivateRoute";
import Report from "./Report";
import Router from "./Router";
import Footer from "./Footer";
import { Route } from "react-router-dom";
import "./App.css";

const App = () => (
  <div>
    <Router>
      <div>
        <Route component={Header} />
        <Route exact path="/" component={Home} />
        <Route path="/callback" component={Callback} />
        <PrivateRoute path="/report/:name" component={Report} />
      </div>
    </Router>
    <div>
      <Footer />
    </div>
  </div>
);

export default App;
