import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../../actions";
import { Link } from "react-router-dom";
import { Container, Navbar, Button } from "reactstrap";
import { customHistory as history } from "../Router";
import { Member } from "../Report/utils";
import { TeamsDropDown } from "./teams";

class LogoutLinks extends React.Component {
  render() {
    const { onLogout, user, teams } = this.props;
    return (
      <div>
        <TeamsDropDown teams={teams} />
        <Member login={user.name} avatar={user.avatar} />
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
      <Button className="mx-3" onClick={onLogin}>
        Login
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

const Header = () => (
  <Container>
    <Navbar>
      <Link to={"/"} className="navbar-brand">
        gitstats.report
      </Link>
      <AuthLinksRedux />
    </Navbar>
  </Container>
);

export default Header;
