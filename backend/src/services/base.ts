import * as moment from "moment";
import {
  ITeam,
  IPeriod,
  IRepo,
  IMember,
  ITeamInfoAPIResult,
  IPullsAPIResult,
  ICommitsAPIResult
} from "gitstats-shared";

export abstract class ServiceClient {
  constructor(
    public token: string,
    public owner: string,
    public period: IPeriod
  ) {}

  abstract ownerInfo: () => Promise<ITeam>;
  abstract repos: () => Promise<IRepo[]>;
  abstract members: () => Promise<IMember[]>;
  abstract pulls: (repo: string) => Promise<IPullsAPIResult>;
  abstract commits: (repo: string) => Promise<ICommitsAPIResult>;

  teamInfo = async (): Promise<ITeamInfoAPIResult> => {
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
    const periodNext = moment(this.period.current.start);
    const periodPrev = moment(this.period.previous.start);
    return {
      name: this.owner,
      period: {
        next: periodNext,
        previous: periodPrev
      },
      values: {}
    };
  };
}
