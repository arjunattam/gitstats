import { IWeekValue } from "gitstats-shared";

export type RepoStats = {
  is_pending: boolean;
  authors?: AuthorStats[];
};

export type AuthorStats = {
  login: string;
  commits: IWeekValue[];
  lines_added: IWeekValue[];
  lines_deleted: IWeekValue[];
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
