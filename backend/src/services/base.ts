import { Moment } from "moment";
import {
  Team,
  Repo,
  Member,
  TeamInfoAPIResult,
  PullsAPIResult,
  CommitsAPIResult,
  PullRequest
} from "gitstats-shared";
import * as types from "../types";

type PRActivity = {
  repo: string;
  pulls: PullRequest[];
};

export abstract class ServiceClient {
  constructor(
    public token: string,
    public owner: string,
    public weekStart: Moment
  ) {}

  abstract ownerInfo: () => Promise<Team>;
  abstract report: () => Promise<types.Report>;
  abstract emailReport: () => Promise<types.EmailReport>;
  abstract statistics: (repo: string) => Promise<types.RepoStats>;
  abstract allCommits: () => Promise<types.Commits[]>;
  abstract prActivity: () => Promise<PRActivity[]>;

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
}
