import { Member, Repo } from "gitstats-shared";

export interface IPeriod {
  previous: string; // start of previous (comparison) week
  next: string; // start of current week
}

export type RepoForReport = Repo & { stats: any; prs: any[] };

export interface IReportJson {
  members: Member[];
  repos: RepoForReport[];
}

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

export interface IPullRequestComment {
  date: string;
  author: string;
}

export interface IPullRequest {
  author: string;
  comments: IPullRequestComment[];
  commits: IAuthorCommit[];
  title: string;
  number: number;
  created_at: string;
  merged_at: string;
  closed_at: string;
  updated_at: string;
  state: string;
  url: string;
}

export interface IPullRequestData {
  repo: string;
  pulls: IPullRequest[];
}

export interface IWeekValues {
  week: number;
  value: number;
}

export interface IAuthorStats {
  login: string;
  commits: IWeekValues[];
}

export interface IRepoStats {
  is_pending: boolean;
  authors: IAuthorStats[];
}

export interface ITeam {
  name: string;
  avatar: string;
  login: string;
  service: string;
}
