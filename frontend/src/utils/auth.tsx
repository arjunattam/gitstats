import Auth0Lock from "auth0-lock";
import jwtDecode from "jwt-decode";
import * as actions from "../actions";
import store from "../store";

type Service = "github" | "bitbucket" | undefined;

const AUTH0_DOMAIN = "karigari.auth0.com";
const AUTH0_AUDIENCE = "http://gitstats-dev/";
const AUTH0_CLIENT_ID = "gWOtsbTPZIPqdbXogY9WaMjhEa7ixVyE";

export class AuthWidget {
  private lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, {
    auth: {
      params: {
        audience: AUTH0_AUDIENCE,
        scope: "openid profile email"
      },
      redirect: false,
      responseType: "token id_token",
      sso: false
    },
    autoclose: true,
    theme: {
      primaryColor: "#3a99d8"
    }
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

  public login = () => {
    this.lock.show();
  };

  private setSession = authResult => {
    const expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );
    window.localStorage.setItem("access_token", authResult.accessToken);
    window.localStorage.setItem("id_token", authResult.idToken);
    window.localStorage.setItem("expires_at", expiresAt);
  };
}

export const isAuthenticated = () => {
  // Check whether the current time is past the token's expiry time
  const expiresAt = JSON.parse(window.localStorage.getItem("expires_at"));
  return new Date().getTime() < expiresAt;
};

export const getUserProfile = () => {
  const idToken = window.localStorage.getItem("id_token");
  return isAuthenticated() && idToken ? jwtDecode(idToken) : {};
};

export const getAccessToken = () => {
  return window.localStorage.getItem("access_token");
};

export const getGitService = (): Service => {
  const { sub } = getUserProfile();

  if (!!sub) {
    if (sub.indexOf("github") >= 0) {
      return "github";
    }
    if (sub.indexOf("bitbucket") >= 0) {
      return "bitbucket";
    }
  }

  return undefined;
};

export const logout = () => {
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("id_token");
  window.localStorage.removeItem("expires_at");
};
