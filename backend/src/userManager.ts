import * as rp from "request-promise-native";
import {
  ServiceManager,
  ServiceTeam,
  GithubManager,
  BitbucketManager
} from "./managers";
import BitbucketService from "./services/bitbucket";
import GithubService from "./services/github";
import * as moment from "moment";
import * as cache from "./redis";
import { ServiceClient } from "./services/base";
import { getPeriodForStartDate } from "gitstats-shared";

enum Service {
  github = "github",
  bitbucket = "bitbucket",
  unknown = "unknown"
}

type EmailContext = {
  name: string;
  subject: string;
  chartUrl: string;
  reportLink: string;
  summaryText: string;
};

class Auth0Client {
  managementToken: string | undefined;

  async setupToken(): Promise<void> {
    // This sets up the management token for Auth0,
    // allowing us to fetch data from Auth0
    const {
      AUTH0_MANAGER_TOKEN_URL: uri,
      AUTH0_MANAGER_AUDIENCE: audience,
      AUTH0_MANAGER_CLIENT_ID: clientId,
      AUTH0_MANAGER_CLIENT_SECRET: clientSecret
    } = process.env;

    const response = await rp({
      uri: uri as string,
      method: "POST",
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        grant_type: "client_credentials"
      },
      json: true
    });
    const { access_token, expires_in } = response;
    // expires in 24 hours
    this.managementToken = access_token;
  }

  async getUser(userId: string) {
    if (!this.managementToken) {
      await this.setupToken();
    }

    const { AUTH0_MANAGER_AUDIENCE: baseUrl } = process.env;
    return rp({
      uri: `${baseUrl}users/${userId}`,
      headers: {
        Authorization: `Bearer ${this.managementToken}`
      },
      json: true
    });
  }
}

export default class UserManager {
  service: Service;
  auth0Client: Auth0Client;
  userAccessToken: string | undefined;
  userRefreshToken: string | undefined;
  serviceManager: ServiceManager | undefined;

  constructor(public userId: string, public ownerName?: string) {
    this.auth0Client = new Auth0Client();

    if (this.userId.startsWith("github")) {
      this.service = Service.github;
    } else if (this.userId.startsWith("bitbucket")) {
      this.service = Service.bitbucket;
    } else {
      this.service = Service.unknown;
    }
  }

  async getServiceToken(): Promise<string> {
    const cacheKey = `token-${this.userId}`;
    const cachedValue = await cache.get(cacheKey);

    if (!!cachedValue) {
      return cachedValue;
    }

    await this.setupServiceManager();

    if (!!this.serviceManager) {
      const tokenResponse = await this.serviceManager.getTeamToken();
      const { token, expiryInSeconds } = tokenResponse;
      const EXPIRY_BUFFER = 10; // seconds
      await cache.set(cacheKey, token, expiryInSeconds - EXPIRY_BUFFER);
      return token;
    }

    return "";
  }

  async getServiceClient(weekStartDate: string): Promise<ServiceClient> {
    let client: ServiceClient;
    const token = await this.getServiceToken();
    const reportPeriod = getPeriodForStartDate(weekStartDate);
    const teamName = this.ownerName as string;

    if (this.service === Service.github) {
      client = new GithubService(token, teamName, reportPeriod);
    } else {
      client = new BitbucketService(token, teamName, reportPeriod);
    }

    return client;
  }

  async getServiceTeams(): Promise<ServiceTeam[]> {
    await this.setupServiceManager();

    if (!!this.serviceManager) {
      return this.serviceManager.getTeams();
    }

    return [];
  }

  private async setupServiceManager() {
    const user = await this.auth0Client.getUser(this.userId);
    const { identities } = user;
    const serviceIdentity = identities.filter(i => i.provider === this.service);
    this.userAccessToken = serviceIdentity[0].access_token as string;
    this.userRefreshToken = serviceIdentity[0].refresh_token as string;

    if (this.service === Service.github) {
      this.serviceManager = new GithubManager(
        this.userAccessToken,
        this.userRefreshToken,
        this.ownerName
      );
    } else if (this.service === Service.bitbucket) {
      this.serviceManager = new BitbucketManager(
        this.userAccessToken,
        this.userRefreshToken,
        this.ownerName
      );
    }
  }

  async getEmailContext(
    weekStartDate: string
  ): Promise<EmailContext | undefined> {
    const client = await this.getServiceClient(weekStartDate);

    if (!!client) {
      const report = await client.emailReport();

      const { name, period, values } = report;
      const { next } = period;
      const keys = Object.keys(values).sort();
      const data: number[] = keys.map(key => values[key]);
      const keysFormatted: string[] = keys.map(key =>
        moment.unix(+key).format("MMM D")
      );

      return {
        name,
        subject: `${name}: gitstats for the week of ${next.format("MMM D")}`,
        summaryText: this.getSummaryText(data),
        chartUrl: this.constructChartUrl(data, keysFormatted),
        reportLink: "https://gitstats.report/"
      };
    }
  }

  private getSummaryText(data: number[]) {
    const prev = data[data.length - 2];
    const next = data[data.length - 1];
    const diff = (next - prev) / prev;

    if (diff >= 0) {
      return `up by ${Math.round(diff * 100)}%`;
    } else {
      return `down by ${Math.round(-1 * diff * 100)}%`;
    }
  }

  private constructChartUrl(data: number[], xAxis: string[]) {
    // "https://image-charts.com/chart?cht=bvs&chd=t%3A200%2C190%2C180%2C290%2C250&chds=a&chof=.png&chs=600x300&chdls=000000&chco=4D89F9%2CC6D9FD&chtt=Commit%20activity&chxt=x%2Cy&chxl=0%3A%7CJan%7CFeb%7CMarch%7CApril%7CMay&chma=10%2C10%2C20&chdlp=b&chf=bg%2Cs%2CFFFFFF&chbh=10&icwt=false";
    const dataString = `t:${data.join(",")}`;
    const axisLabels = `0:|${xAxis.join("|")}`;
    const params = {
      cht: "bvs",
      chd: dataString,
      chds: "a",
      chof: ".png",
      chs: "600x300",
      chdls: "000000",
      chco: "4D89F9,C6D9FD",
      chtt: "Weekly commit activity",
      chxt: "x,y",
      chxl: axisLabels,
      chdlp: "b",
      chf: "bg,s,FFFFFF",
      chbh: "10"
    };
    const query = Object.keys(params)
      .map(k => k + "=" + encodeURIComponent(params[k]))
      .join("&");
    return `https://image-charts.com/chart?${query}`;
  }
}
