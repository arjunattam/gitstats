interface IPeriod {
  previous: string; // start of previous (comparison) week
  next: string; // start of current week
}

interface IPullRequestComment {
  date: string;
  author: string;
}

interface IPullRequest {
  author: string;
  comments: IPullRequestComment[];
  commits: any[];
  // add the rest
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
  description: string;
  is_private: boolean;
  is_fork: boolean;
  stargazers_count: number;
  updated_at: string;
  stats: IRepoStats;
}

interface ISummaryProps {
  period: IPeriod;
  repos: IRepository[];
  prData: IPullRequestData[];
  isLoading: boolean;
}

interface ITeam {
  name: string;
  avatar: string;
  login: string;
  service: string;
}
