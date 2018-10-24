import { IRepo, IWeekValue } from "gitstats-shared";

export interface IPeriodDeprecated {
  previous: string; // start of previous (comparison) week
  next: string; // start of current week
}

export type RepoForReport = IRepo & { stats: any };

export interface ICommits {
  repo: string;
  commits: ICommitData[];
}

export interface ICommitData {
  author: string;
  commits: IAuthorCommit[];
}

export interface IAuthorCommit {
  date: string;
  message: string;
  sha: string;
}

export interface IAuthorStats {
  login: string;
  commits: IWeekValue[];
}

export interface IRepoStats {
  is_pending: boolean;
  authors: IAuthorStats[];
}
