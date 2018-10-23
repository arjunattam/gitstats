import * as moment from "moment";
import {
  Team,
  Repo,
  Member,
  TeamInfoAPIResult,
  PullsAPIResult,
  CommitsAPIResult
} from "gitstats-shared";

export abstract class ServiceClient {
  periodPrev: moment.Moment;
  periodNext: moment.Moment;

  constructor(
    public token: string,
    public owner: string,
    public weekStart: moment.Moment
  ) {
    // We use Sunday-Saturday as the definition of the week
    // This is because of how the Github stats API returns weeks
    this.periodPrev = moment(this.weekStart).subtract(1, "weeks");
    this.periodNext = moment(this.weekStart);
  }

  abstract ownerInfo: () => Promise<Team>;
  abstract repos: () => Promise<Repo[]>;
  abstract members: () => Promise<Member[]>;
  abstract pullsV2: (repo: string) => Promise<PullsAPIResult>;
  abstract commitsV2: (repo: string) => Promise<CommitsAPIResult>;

  teamInfo = async (): Promise<TeamInfoAPIResult> => {
    const responses = await Promise.all([
      this.ownerInfo(),
      this.repos(),
      this.members()
    ]);
    const team = responses[0];
    return {
      ...team,
      repos: responses[1],
      members: responses[2]
    };
  };

  emailReport = async () => {
    return {
      name: this.owner,
      period: {
        next: this.periodNext,
        previous: this.periodPrev
      },
      values: {}
    };
  };
}
