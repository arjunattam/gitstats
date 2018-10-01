import jwtDecode from "jwt-decode";
import Auth0Lock from "auth0-lock";
import store from "../store";
import * as actions from "../actions";

const AUTH0_DOMAIN = "karigari.auth0.com";
const AUTH0_AUDIENCE = "http://gitstats-dev/";
const AUTH0_CLIENT_ID = "gWOtsbTPZIPqdbXogY9WaMjhEa7ixVyE";

export class AuthWidget {
  lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, {
    auth: {
      params: {
        scope: "openid profile email",
        audience: AUTH0_AUDIENCE
      },
      responseType: "token id_token",
      redirect: false,
      sso: false
    },
    theme: {
      primaryColor: "#3a99d8"
    },
    autoclose: true
  });

  constructor() {
    this.lock.on("authenticated", authResult => {
      this.lock.getUserInfo(authResult.accessToken, (error, profile) => {
        if (error) {
          return;
        }

        this.setSession(authResult);
        store.dispatch(actions.authenticated());
      });
    });
  }

  login = () => {
    this.lock.show();
  };

  setSession = authResult => {
    let expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );
    Storage.set("access_token", authResult.accessToken);
    Storage.set("id_token", authResult.idToken);
    Storage.set("expires_at", expiresAt);
  };
}

export const isAuthenticated = () => {
  // Check whether the current time is past the token's expiry time
  let expiresAt = JSON.parse(Storage.get("expires_at"));
  return new Date().getTime() < expiresAt;
};

export const getUserProfile = () => {
  const idToken = Storage.get("id_token");
  return idToken ? jwtDecode(idToken) : {};
};

export const getAccessToken = () => {
  return Storage.get("access_token");
};

export const logout = () => {
  Storage.remove("access_token");
  Storage.remove("id_token");
  Storage.remove("expires_at");
};

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
