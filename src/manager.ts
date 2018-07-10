import * as moment from "moment";
const rp = require("request-promise-native");
const jwt = require("jsonwebtoken");

export type ServiceTeam = {
  id: number | string;
  name: string;
  avatar: string;
  type: string;
};

export abstract class ServiceManager {
  constructor(
    public accessToken: string,
    public refreshToken: string,
    public teamName?: string
  ) {}
  abstract getTeams(): Promise<ServiceTeam[]>;
  abstract getTeamToken(): Promise<string>;
}

export class GithubManager extends ServiceManager {
  makeRequest({ uri, qs, headers, method }) {
    return rp({
      uri,
      qs,
      method,
      baseUrl: "https://api.github.com/",
      headers: {
        "User-Agent": "gitstats.report",
        Accept: `application/vnd.github.machine-man-preview+json`,
        ...headers
      },
      json: true
    });
  }

  getTeams(): Promise<ServiceTeam[]> {
    return this.makeRequest({
      uri: "user/installations",
      qs: {
        access_token: this.accessToken
      },
      headers: {},
      method: "GET"
    }).then(response => {
      const { installations } = response;
      const parsed: ServiceTeam[] = installations.map(ins => ({
        id: ins.id,
        name: ins.account.login,
        avatar: ins.account.avatar_url,
        type: ins.account.type
      }));
      return parsed;
    });
  }

  getTeamForToken(): Promise<ServiceTeam> {
    return this.getTeams().then(installations => {
      let filtered;

      if (this.teamName) {
        filtered = installations.filter(i => i.name === this.teamName);
      }

      if (filtered.length > 0) {
        return filtered[0];
      } else {
        return installations[0];
      }
    });
  }

  getTeamToken(): Promise<string> {
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

    // Github tokens depend on the team (= installation)
    return this.getTeamForToken().then(team => {
      const { id, name } = team;
      return this.makeRequest({
        uri: `installations/${id}/access_tokens`,
        qs: {},
        headers: { Authorization: `Bearer ${token}` },
        method: "POST"
      }).then(response => {
        const { token } = response;
        return token;
      });
    });
  }
}

export class BitbucketManager extends ServiceManager {
  newAccessToken: string | undefined;

  getNewToken(): Promise<string> {
    if (this.newAccessToken) {
      return new Promise((resolve, _) => resolve(this.newAccessToken));
    } else {
      const { BITBUCKET_CLIENT_ID, BITBUCKET_CLIENT_SECRET } = process.env;
      const encodedAuth = Buffer.from(
        `${BITBUCKET_CLIENT_ID}:${BITBUCKET_CLIENT_SECRET}`
      ).toString("base64");

      return rp({
        uri: `https://bitbucket.org/site/oauth2/access_token`,
        method: "POST",
        formData: {
          refresh_token: this.refreshToken,
          grant_type: "refresh_token"
        },
        json: true,
        headers: { Authorization: `Basic ${encodedAuth}` }
      }).then(response => {
        this.newAccessToken = response.access_token;
        return response.access_token;
      });
    }
  }

  getTeams(): Promise<ServiceTeam[]> {
    return this.getNewToken()
      .then(() => {
        return rp({
          uri: `https://api.bitbucket.org/2.0/teams`,
          qs: { role: "member" },
          headers: { Authorization: `Bearer ${this.newAccessToken}` },
          json: true
        });
      })
      .then(response => {
        const { values } = response;
        return values.map(team => ({
          id: team.uuid,
          name: team.display_name,
          avatar: team.links.avatar.href,
          type: team.type
        }));
      });
  }

  getTeamToken(): Promise<string> {
    return this.getNewToken();
  }
}
