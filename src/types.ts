export type Member = {
  login: string;
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

export type AuthorStats = {
  login: string;
  commits: {
    previous: number;
    next: number;
  };
  lines_added: {
    previous: number;
    next: number;
  };
  lines_deleted: {
    previous: number;
    next: number;
  };
};

export type RepoStats = {
  is_pending: boolean;
  authors?: AuthorStats[];
};
