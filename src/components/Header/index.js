import React from "react";
import { Container, Navbar, NavbarBrand, Button } from "reactstrap";
import { Link } from "react-router-dom";
import Auth from "../../utils/auth";

class AuthState extends React.Component {
  state = { isLoggedIn: false };

  componentDidMount() {
    this.auth = new Auth();
    console.log(this.auth.getUserProfile());
    this.updateAuthState();
  }

  updateAuthState = () => {
    this.setState({ isLoggedIn: this.auth.isAuthenticated() });
  };

  login = () => {
    this.auth.login();
    this.updateAuthState();
  };

  logout = () => {
    this.auth.logout();
    this.updateAuthState();
  };

  render() {
    return this.state.isLoggedIn ? (
      <div>
        <Button onClick={() => this.logout()}>Logout</Button>
      </div>
    ) : (
      <div>
        <Button onClick={() => this.login()}>Login</Button>
      </div>
    );
  }
}

const Header = () => (
  <Container>
    <Navbar>
      <NavbarBrand href="/">gitstats.report</NavbarBrand>
      <AuthState />
    </Navbar>
  </Container>
);

export default Header;
