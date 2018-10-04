interface IPeriod {
  previous: string; // start of previous (comparison) week
  next: string; // start of current week
}

interface IMember {
  login: string;
  name: string;
  avatar: string;
}

interface IReportJson {
  members: IMember[];
  repos: IRepository[];
}

interface ICommits {
  repo: string;
  commits: ICommitData[];
}

interface ICommitData {
  author: string;
  commits: IAuthorCommit[];
}

interface IAuthorCommit {
  date: string;
  message: string;
  sha: string;
}

interface IPullRequestComment {
  date: string;
  author: string;
}

interface IPullRequest {
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

interface IPullRequestData {
  repo: string;
  pulls: IPullRequest[];
}

interface IWeekValues {
  week: number;
  value: number;
}

interface IAuthorStats {
  login: string;
  commits: IWeekValues[];
}

interface IRepoStats {
  is_pending: boolean;
  authors: IAuthorStats[];
}

interface IRepository {
  name: string;
  url: string;
  description: string;
  is_private: boolean;
  is_fork: boolean;
  stargazers_count: number;
  updated_at: string;
  stats: IRepoStats;
}

interface ITeam {
  name: string;
  avatar: string;
  login: string;
  service: string;
}
