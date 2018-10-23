import { WeekValue } from "gitstats-shared";

export type RepoStats = {
  is_pending: boolean;
  authors?: AuthorStats[];
};

export type AuthorStats = {
  login: string;
  commits: WeekValue[];
  lines_added: WeekValue[];
  lines_deleted: WeekValue[];
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
