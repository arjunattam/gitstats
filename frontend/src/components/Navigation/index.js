import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../actions";
import { Link } from "react-router-dom";
import { Container, Navbar, Button } from "reactstrap";
import { customHistory as history } from "../Router";
import { MemberName } from "../Common";
import { TeamsDropDown } from "./teams";

const GITHUB_LINK = "https://github.com/karigari/gitstats";

class LogoutLinks extends React.Component {
  render() {
    const { onLogout, user, teams } = this.props;
    return (
      <div>
        <TeamsDropDown teams={teams} />
        <MemberName name={user.name} login={user.name} avatar={user.avatar} />
        <Button className="mx-3" onClick={onLogout}>
          Logout
        </Button>
      </div>
    );
  }
}

const LoginLinks = ({ onLogin }) => {
  return (
    <div>
      <Button className="mx-2" onClick={onLogin}>
        Login
      </Button>
      <Button className="mx-2" onClick={onLogin}>
        Signup
      </Button>
    </div>
  );
};

class AuthLinks extends React.Component {
  constructor(props) {
    super(props);
    this.actions = bindActionCreators(actions, this.props.dispatch);
  }

  login = () => {
    this.actions.login();
  };

  logout = () => {
    this.actions.logout();
    history.replace("/");
  };

  componentDidMount() {
    const { isLoggedIn } = this.props.data;

    if (isLoggedIn) {
      this.actions.fetchTeams();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { isLoggedIn: wasLoggedIn } = prevProps.data;
    const { isLoggedIn } = this.props.data;

    if (wasLoggedIn !== isLoggedIn && isLoggedIn) {
      this.actions.fetchTeams();
    }
  }

  render() {
    const { isLoggedIn } = this.props.data;
    return isLoggedIn ? (
      <LogoutLinks {...this.props.data} onLogout={() => this.logout()} />
    ) : (
      <LoginLinks onLogin={() => this.login()} />
    );
  }
}

function mapStateToProps(state) {
  const { data } = state;
  return { data };
}

const AuthLinksRedux = connect(mapStateToProps)(AuthLinks);

const NavigationBar = () => (
  <Container>
    <Navbar>
      <div>
        <Link to={"/"} className="navbar-brand">
          gitstats.report
        </Link>
        <a href={GITHUB_LINK} target="_blank" className="text-white-50">
          Code on GitHub
        </a>
      </div>
      <AuthLinksRedux />
    </Navbar>
  </Container>
);

export default NavigationBar;
