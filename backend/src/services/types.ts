import { Moment } from "moment";

export abstract class ServiceClient {
  constructor(
    public token: string,
    public owner: string,
    public weekStart: Moment
  ) {}
  abstract report: () => Promise<Report>;
  abstract emailReport: () => Promise<EmailReport>;
  abstract statistics: (repo: string) => Promise<RepoStats>;
  abstract allCommits: () => Promise<Commits[]>;
  abstract prActivity: () => Promise<any>;
}

export type Report = {
  period: Period;
  owner: Owner;
  members: Member[];
  repos: RepoForReport[];
};

export type EmailReport = {
  owner: Owner;
  period: Period;
  repos: any[];
};

export type Period = {
  previous: Moment;
  next: Moment;
};

export type Member = {
  login: string;
  name: string;
  avatar: string;
};

export type Owner = {
  login: string;
  name: string;
  avatar: string;
};

export type Repo = {
  name: string;
  description: string;
  is_private: boolean;
  is_fork: boolean;
  stargazers_count: number;
  updated_at: string;
};

export type RepoStats = {
  is_pending: boolean;
  authors?: AuthorStats[];
};

export type RepoWithStats = Repo & { stats: RepoStats };

export type RepoForReport = Repo & { stats: RepoStats; prs: RepoPR[] };

// TODO(arjun): we can potentially add the reviewer
// and also the time taken to review
export type RepoPR = {
  author: string;
  prs_opened: {
    previous: number;
    next: number;
  };
  prs_merged: {
    previous: number;
    next: number;
  };
  time_to_merge: {
    previous: number[];
    next: number[];
  };
};

type WeekValues = {
  week: number;
  value: number;
};

export type AuthorStats = {
  login: string;
  commits: WeekValues[];
  lines_added: WeekValues[];
  lines_deleted: WeekValues[];
};

export type Commits = {
  repo: string;
  commits: RepoCommits[];
};

export type RepoCommits = {
  author: string;
  commits: AuthorCommit[];
};

export type AuthorCommit = {
  date: string;
  message: string;
  sha: string;
};
