import Auth0Manager from "./auth0";
import * as moment from "moment";
const rp = require("request-promise-native");
const jwt = require("jsonwebtoken");

type GitHubInstallation = {
  id: number;
  accountName: string;
  accountPicture: string;
  accountType: string;
  // accountMemberCount: number;
};

export default class UserManager {
  userId: string;
  auth0Manager: Auth0Manager | undefined;
  userAccessToken: string | undefined;

  constructor(accessToken: string) {
    const decoded = jwt.decode(accessToken);
    this.userId = decoded.sub;
    this.auth0Manager = new Auth0Manager();
  }

  getGhToken(): Promise<string> {
    return (
      this.getUserDetails()
        .then(() => this.getUserInstallations())
        // TODO(arjun): this assumes the first installation
        .then(installations => this.getInstallationToken(installations[0]))
    );
  }

  getUserDetails() {
    return this.auth0Manager
      .getToken()
      .then(() => this.auth0Manager.getUser(this.userId))
      .then(response => {
        const { identities } = response;
        const ghIdentity = identities.filter(i => i.provider === "github")[0];
        this.userAccessToken = ghIdentity.access_token;
      });
  }

  getUserInstallations = () => {
    return rp({
      uri: `https://api.github.com/user/installations`,
      qs: {
        access_token: this.userAccessToken
      },
      headers: {
        "User-Agent": "gitstats.report",
        Accept: `application/vnd.github.machine-man-preview+json`
      },
      json: true
    }).then(response => {
      const { installations } = response;
      const parsed: Array<GitHubInstallation> = installations.map(
        installation => ({
          id: installation.id,
          accountName: installation.account.login,
          accountPicture: installation.account.avatar_url,
          accountType: installation.account.type
        })
      );
      return parsed;
    });
  };

  getInstallationToken = installation => {
    // First get github JWT
    const payload = {
      iat: moment().unix(),
      exp: moment()
        .add(5, "minutes")
        .unix(),
      iss: +process.env.GITHUB_APP_ID
    };
    const token = jwt.sign(payload, process.env.GITHUB_APP_PRIVATE_KEY, {
      algorithm: "RS256"
    });
    const { id, accountName } = installation;

    return rp({
      uri: `https://api.github.com/installations/${id}/access_tokens`,
      method: "POST",
      headers: {
        "User-Agent": "gitstats.report",
        Authorization: `Bearer ${token}`,
        Accept: `application/vnd.github.machine-man-preview+json`
      },
      json: true
    }).then(response => {
      const { token } = response;
      // TODO(arjun): remove log
      console.log(`Installation token ${accountName} ${token}`);
      return token;
    });
  };
}
