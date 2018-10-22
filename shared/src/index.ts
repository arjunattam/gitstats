export type Team = {
  login: string;
  name: string;
  avatar: string;
  service: string;
};

export type TeamInfoAPIResult = Team & {
  repos: Repo[];
  members: Member[];
};

export type Repo = {
  name: string;
  url: string;
  description: string;
  is_private: boolean;
  is_fork: boolean;
  stargazers_count: number;
  updated_at: string;
};

export type Member = {
  login: string;
  name: string;
  avatar: string;
};

export type Commit = {
  author: string;
  date: string;
  message: string;
  sha: string;
};

export type Comment = {
  author: string;
  date: string;
};

export type PullRequest = {
  author: string;
  title: string;
  number: number;
  created_at: string;
  merged_at: string;
  closed_at: string;
  updated_at: string;
  state: string;
  url: string;
  comments: Comment[];
  commits: Commit[];
};

export type PullsAPIResult = {
  repo: string;
  pulls: PullRequest[];
};

export type WeekValue = {
  week: number;
  value: number;
};

export type RepoStats = {
  author: string;
  commits: WeekValue[];
};

export type CommitsAPIResult = {
  repo: string;
  is_pending: boolean;
  stats: RepoStats[];
  commits: Commit[];
};
