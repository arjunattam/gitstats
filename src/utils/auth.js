import auth0 from "auth0-js";
import jwtDecode from "jwt-decode";
import { customHistory as history } from "../components/Router";

const AUTH0_DOMAIN = "karigari.auth0.com";
const AUTH0_AUDIENCE = "http://gitstats-dev/";

class Storage {
  static get(key) {
    return window.localStorage.getItem(key);
  }

  static remove(key) {
    return window.localStorage.removeItem(key);
  }

  static set(key, value) {
    return window.localStorage.setItem(key, value);
  }
}

export default class Auth {
  webAuth = new auth0.WebAuth({
    domain: AUTH0_DOMAIN,
    audience: AUTH0_AUDIENCE,
    clientID: "gWOtsbTPZIPqdbXogY9WaMjhEa7ixVyE",
    responseType: "token id_token",
    redirectUri: `${window.location.origin}/callback`,
    scope: "openid profile"
  });

  login = () => {
    this.webAuth.authorize();
  };

  handleAuthentication = () => {
    this.webAuth.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
        history.replace("/");

        // TODO(arjun) after this, we will have to check if this has installations
        // if not, we need to set that up
      } else if (err) {
        history.replace("/");
        // TODO(arjun): this should have a useful error message
        console.log(err);
      }
    });
  };

  setSession = authResult => {
    let expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );
    Storage.set("access_token", authResult.accessToken);
    Storage.set("id_token", authResult.idToken);
    Storage.set("expires_at", expiresAt);
  };

  logout = () => {
    Storage.remove("access_token");
    Storage.remove("id_token");
    Storage.remove("expires_at");

    // navigate to the home route
    history.replace("/");
  };

  isAuthenticated = () => {
    // Check whether the current time is past the token's expiry time
    let expiresAt = JSON.parse(Storage.get("expires_at"));
    return new Date().getTime() < expiresAt;
  };

  getUserProfile = () => {
    const idToken = Storage.get("id_token");
    return idToken ? jwtDecode(idToken) : {};
  };

  getAuthHeader = () => {
    const accessToken = Storage.get("access_token");
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  };
}
