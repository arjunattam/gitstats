import * as moment from "moment";
import * as rp from "request-promise-native";
import * as jwt from "jsonwebtoken";

export type ServiceTeam = {
  id: number | string;
  login: string;
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
  request({ uri, qs, headers, method }) {
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

  async getTeams(): Promise<ServiceTeam[]> {
    const response = await this.request({
      uri: "user/installations",
      qs: {
        access_token: this.accessToken
      },
      headers: {},
      method: "GET"
    });

    const { installations } = response;
    const parsed: ServiceTeam[] = installations.map(ins => ({
      id: ins.id,
      login: ins.account.login,
      name: ins.account.login,
      avatar: ins.account.avatar_url,
      type: ins.account.type
    }));
    return parsed;
  }

  async getTeamToken(): Promise<string> {
    const payload = {
      iat: moment().unix(),
      exp: moment()
        .add(5, "minutes")
        .unix(),
      iss: +process.env.GITHUB_APP_ID
    };
    const authToken = jwt.sign(payload, process.env.GITHUB_APP_PRIVATE_KEY, {
      algorithm: "RS256"
    });

    // Github tokens depend on the team (= installation)
    const team = await this.getTeamForToken();
    const { id } = team;
    const response = await this.request({
      uri: `installations/${id}/access_tokens`,
      qs: {},
      headers: { Authorization: `Bearer ${authToken}` },
      method: "POST"
    });
    const { token, expires_at } = response;
    // expires_at is ISO date time string, 1 hour expiry
    return token;
  }

  private async getTeamForToken(): Promise<ServiceTeam> {
    const installations = await this.getTeams();
    let filtered;

    if (this.teamName) {
      filtered = installations.filter(i => i.name === this.teamName);
    }

    if (filtered.length > 0) {
      return filtered[0];
    } else {
      return installations[0];
    }
  }
}

export class BitbucketManager extends ServiceManager {
  newAccessToken: string | undefined;

  async getTeams(): Promise<ServiceTeam[]> {
    await this.getNewToken();
    const response = await rp({
      uri: `https://api.bitbucket.org/2.0/teams`,
      qs: { role: "member" },
      headers: { Authorization: `Bearer ${this.newAccessToken}` },
      json: true
    });
    const { values } = response;
    return values.map(team => ({
      id: team.uuid,
      login: team.username,
      name: team.display_name,
      avatar: team.links.avatar.href,
      type: team.type
    }));
  }

  getTeamToken(): Promise<string> {
    return this.getNewToken();
  }

  private async getNewToken(): Promise<string> {
    if (this.newAccessToken) {
      return Promise.resolve(this.newAccessToken);
    } else {
      const { BITBUCKET_CLIENT_ID, BITBUCKET_CLIENT_SECRET } = process.env;
      const encodedAuth = Buffer.from(
        `${BITBUCKET_CLIENT_ID}:${BITBUCKET_CLIENT_SECRET}`
      ).toString("base64");

      const response = await rp({
        uri: `https://bitbucket.org/site/oauth2/access_token`,
        method: "POST",
        formData: {
          refresh_token: this.refreshToken,
          grant_type: "refresh_token"
        },
        json: true,
        headers: { Authorization: `Basic ${encodedAuth}` }
      });
      const { access_token, expires_in } = response;
      // expires in 2 hours
      this.newAccessToken = access_token;
      return response.access_token;
    }
  }
}
