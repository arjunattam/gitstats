import Auth0Manager from "./auth0";
import {
  ServiceManager,
  ServiceTeam,
  GithubManager,
  BitbucketManager
} from "./manager";
const jwt = require("jsonwebtoken");

enum Service {
  github = "github",
  bitbucket = "bitbucket"
}

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

  getUserDetails() {
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

  getServiceToken(): Promise<string> {
    return this.serviceManager.getTeamToken();
  }

  getServiceTeams(): Promise<ServiceTeam[]> {
    return this.serviceManager.getTeams();
  }
}
