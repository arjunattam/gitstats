export type TeamInfoAPIResult = {
  team: Owner;
  repos: Repo[];
  members: Member[];
};

type Owner = {
  login: string;
  name: string;
  avatar: string;
};

type Repo = {
  name: string;
  url: string;
  description: string;
  is_private: boolean;
  is_fork: boolean;
  stargazers_count: number;
  updated_at: string;
};

type Member = {
  login: string;
  name: string;
  avatar: string;
};
