import { Moment } from "moment";
import { Team, Repo, Member } from "gitstats-shared";

export type Report = {
  members: Member[];
  repos: RepoForReport[];
};

export type EmailReport = {
  owner: Team;
  period: Period;
  repos: any[];
};

export type Period = {
  previous: Moment;
  next: Moment;
};

export type RepoStats = {
  is_pending: boolean;
  authors?: AuthorStats[];
};

export type RepoWithStats = Repo & { stats: RepoStats };

export type RepoForReport = Repo & { stats: RepoStats; prs: RepoPR[] };

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
