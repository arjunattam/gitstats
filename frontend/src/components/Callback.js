import React from "react";
import Auth from "../utils/auth";
import { Link } from "react-router-dom";
import { Container } from "reactstrap";
import { getTeams } from "../utils/api";

const GH_SETUP_LINK = "https://github.com/apps/gitstats-dev/installations/new";

export default class CallbackPage extends React.Component {
  state = { isLoading: true, teams: [] };

  handleAuthentication = cb => {
    const auth = new Auth();
    const nextState = this.props;

    if (/access_token|id_token|error/.test(nextState.location.hash)) {
      auth.handleAuthentication(cb);
    } else {
      cb();
    }
  };

  setupTeams = () => {
    window.location = GH_SETUP_LINK;
  };

  componentDidMount() {
    this.handleAuthentication(() => {
      getTeams().then(response => {
        const { message } = response;

        if (message.length > 0) {
          // We have some teams
          this.setState({ teams: message, isLoading: false });
        } else {
          // No teams
          this.setupTeams();
        }
      });
    });
  }

  renderLoading = () => {
    return (
      <Container>
        <p>Loading your account...</p>
      </Container>
    );
  };

  renderTeams = () => {
    return (
      <Container>
        <p>Your teams</p>
        <ul>
          {this.state.teams.map(team => {
            return (
              <li key={team.id}>
                <Link to={`/report/${team.login}`}>{team.name}</Link>
              </li>
            );
          })}
          <li>
            <a href="#" onClick={() => this.setupTeams()}>
              Setup more teams
            </a>
          </li>
        </ul>
      </Container>
    );
  };

  render() {
    return (
      <Container>
        {this.state.isLoading ? this.renderLoading() : this.renderTeams()}
      </Container>
    );
  }
}
