import { Moment } from "moment";

export interface IService {
  report();
  emailReport: () => Promise<EmailReport>;
  statistics: (repo: string) => Promise<RepoStats>;
  allCommits: () => Promise<Commits[]>;
  prActivity: () => Promise<any>;
}

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
