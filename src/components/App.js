import React from "react";
import Header from "./Header";
import Callback from "./Callback";
import PrivateRoute from "./PrivateRoute";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import "./App.css";

const App = () => (
  <Router>
    <div>
      <Header />
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/app">Report</Link>
        </li>
      </ul>

      <hr />

      <Route exact path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/callback" component={Callback} />
      <PrivateRoute path="/app" component={Report} />
    </div>
  </Router>
);

const Report = () => <div>Report</div>;

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
);

const About = () => (
  <div>
    <h2>About</h2>
  </div>
);

// class App extends Component {
//   render() {
//     return (
//       <div className="App">

//         <header className="App-header">
//           <h1 className="App-title">Welcome to React</h1>
//         </header>
//         <p className="App-intro">
//           To get started, edit <code>src/App.js</code> and save to reload.
//         </p>
//       </div>
//     );
//   }
// }

export default App;
