import APICaller from "./api";
import { getComparativeResponse } from "./utils";
import * as moment from "moment";

type Member = {
  login: string;
  avatar: string;
};

type Repo = {
  name: string;
  description: string;
  is_private: boolean;
  is_fork: boolean;
  stargazers_count: number;
  updated_at: string;
};

export default class GithubService extends APICaller {
  repos(): Promise<Array<Repo>> {
    // Doc: https://developer.github.com/v3/repos/#list-organization-repositories
    // We can also use https://api.github.com/installation/repositories
    // but that limits us to the organisations in the installation
    // TODO(arjun): this will not work for usernames
    const params = {
      path: `orgs/${this.owner}/repos`
    };
    return this.getAllPages([], params)
      .then(repos =>
        repos
          .filter(repo => moment(repo.updated_at) > this.timeLimit)
          .map(repo => ({
            name: repo.name,
            description: repo.description,
            is_private: repo.private,
            is_fork: repo.fork,
            stargazers_count: repo.stargazers_count,
            updated_at: repo.updated_at
          }))
      )
      .then(repos => {
        const names = repos.map(repo => repo.name);
        const stars = names.map(name => this.stargazers(name));
        return Promise.all(stars).then(values => {
          let index;
          let result = [];
          for (index = 0; index < repos.length; index++) {
            result.push({
              ...repos[index],
              stargazers: values[index]
            });
          }
          return result;
        });
      });
  }

  members(): Promise<Array<Member>> {
    // Doc: https://developer.github.com/v3/orgs/members/#members-list
    // TODO(arjun): this will not work for usernames
    const params = {
      path: `orgs/${this.owner}/members`
    };
    return this.getAllPages([], params).then(members => {
      return members.map(member => ({
        login: member.login,
        avatar: member.avatar_url
      }));
    });
  }

  issues(repo: string) {
    // TODO(arjun): this can be used for both issues and PRs, which means we cannot
    // differentiate between a closed PR and a merged PR
    const params = {
      path: `repos/${this.owner}/${repo}/issues`,
      headers: {},
      qs: {
        state: "all",
        since: this.timeLimit.toISOString()
      }
    };
    return this.getAllPages([], params).then(response => {
      return {
        name: "issues_created",
        values: getComparativeResponse(response, "created_at")
      };
    });
  }

  stargazers(repo: string) {
    // This doesn't work for repos that have >40,000 stars because
    // API returns only 400 pages (100 records per page)
    const params = {
      path: `repos/${this.owner}/${repo}/stargazers`,
      headers: { Accept: "application/vnd.github.v3.star+json" },
      qs: {}
    };
    return this.getAllFromLast(params, "starred_at").then(response => {
      return getComparativeResponse(response, "starred_at");
    });
  }
}
