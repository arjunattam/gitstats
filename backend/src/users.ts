import Auth0Manager from "./auth0";
import {
  ServiceManager,
  ServiceTeam,
  GithubManager,
  BitbucketManager
} from "./manager";
import BitbucketService from "./bitbucket";
import GithubService from "./github";
import * as moment from "moment";
const jwt = require("jsonwebtoken");

enum Service {
  github = "github",
  bitbucket = "bitbucket"
}

type EmailContext = {
  name: string;
  subject: string;
  chartUrl: string;
  reportLink: string;
};

export default class UserManager {
  userId: string;
  service: Service;
  auth0Manager: Auth0Manager | undefined;
  userAccessToken: string | undefined;
  userRefreshToken: string | undefined;
  serviceManager: ServiceManager | undefined;

  constructor(accessToken: string, private accountName?: string) {
    const decoded = jwt.decode(accessToken);
    this.userId = decoded.sub;

    if (this.userId.startsWith("github")) {
      this.service = Service.github;
    } else if (this.userId.startsWith("bitbucket")) {
      this.service = Service.bitbucket;
    }

    this.auth0Manager = new Auth0Manager();
  }

  getServiceClient() {
    return this.getUserDetails()
      .then(() => this.getServiceToken())
      .then(token => {
        let client;

        if (this.service === "github") {
          client = new GithubService(token, this.accountName);
        } else if (this.service === "bitbucket") {
          client = new BitbucketService(token, this.accountName);
        }

        return client;
      });
  }

  getServiceTeams(): Promise<ServiceTeam[]> {
    return this.getUserDetails().then(() => this.serviceManager.getTeams());
  }

  getEmailContext(): Promise<EmailContext> {
    return this.getServiceClient()
      .then(client => client.emailReport())
      .then(report => {
        let weekWiseData = {};
        const { owner, period, repos } = report;
        const { next } = period;
        const { name } = owner;

        repos.forEach(repo => {
          const { stats } = repo;
          const { authors } = stats;
          authors.forEach(authorStats => {
            const { commits } = authorStats;
            commits.forEach(({ week, value }) => {
              if (week in weekWiseData) {
                weekWiseData[week] = value + weekWiseData[week];
              } else {
                weekWiseData[week] = value;
              }
            });
          });
        });

        const keys = Object.keys(weekWiseData).sort();
        const data = keys.map(key => weekWiseData[key]);
        const keysFormatted = keys.map(key =>
          moment.unix(+key).format("MMM D")
        );

        return {
          name,
          subject: `${name}: gitstats for the week of ${next.format("MMM D")}`,
          summaryText: this.getSummaryText(data),
          chartUrl: this.constructChartUrl(data, keysFormatted),
          reportLink: "https://gitstats.report/"
        };
      });
  }

  private getSummaryText(data) {
    const prev = data[data.length - 2];
    const next = data[data.length - 1];
    const diff = (next - prev) / prev;

    if (diff >= 0) {
      return `up by ${Math.round(diff * 100)}%`;
    } else {
      return `down by ${Math.round(-1 * diff * 100)}%`;
    }
  }

  private constructChartUrl(data, xAxis) {
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

  private getUserDetails() {
    return this.auth0Manager
      .getToken()
      .then(() => this.auth0Manager.getUser(this.userId))
      .then(response => {
        const { identities } = response;
        const serviceIdentity = identities.filter(
          i => i.provider === this.service
        );
        this.userAccessToken = serviceIdentity[0].access_token;
        this.userRefreshToken = serviceIdentity[0].refresh_token;

        if (this.service === "github") {
          this.serviceManager = new GithubManager(
            this.userAccessToken,
            this.userRefreshToken,
            this.accountName
          );
        } else if (this.service === "bitbucket") {
          this.serviceManager = new BitbucketManager(
            this.userAccessToken,
            this.userRefreshToken,
            this.accountName
          );
        }
      });
  }

  private getServiceToken(): Promise<string> {
    return this.serviceManager.getTeamToken();
  }
}
