import APICaller from "./api";
import { getComparativeResponse } from "./utils";
import * as moment from "moment";

type Member = {
  login: string;
  avatar: string;
};

type Owner = {
  login: string;
  name: string;
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

type AuthorStats = {
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

type RepoStats = {
  is_pending: boolean;
  authors?: AuthorStats[];
};

export default class GithubService extends APICaller {
  report() {
    return Promise.all([this.repos(), this.members(), this.ownerInfo()]).then(
      values => {
        const repos = values[0];
        const stats = repos.map(repo => this.statistics(repo.name));
        return Promise.all(stats).then(statsValues => {
          let repoResult = [];
          let index;

          for (index = 0; index < repos.length; index++) {
            repoResult.push({ ...repos[index], stats: statsValues[index] });
          }

          return {
            period: this.period(),
            owner: values[2],
            members: values[1],
            repos: repoResult
          };
        });
      }
    );
  }

  period() {
    return {
      previous: moment()
        .utc()
        .startOf("week")
        .subtract(2, "weeks")
        .toISOString(),
      next: moment()
        .utc()
        .startOf("week")
        .subtract(1, "weeks")
        .toISOString()
    };
  }

  repos(): Promise<Array<Repo>> {
    // Doc: https://developer.github.com/v3/repos/#list-organization-repositories
    // We can also use https://api.github.com/installation/repositories
    // but that limits us to the organisations in the installation
    // TODO(arjun): this will not work for usernames
    const params = {
      path: `orgs/${this.owner}/repos`
      // These qs will work for the https://developer.github.com/v3/repos/#list-user-repositories
      // However, that API does not return private repos for orgs
      // qs: {
      //   sort: "updated",
      //   direction: "desc"
      // }
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
        repos.map(repo => this.statistics(repo.name));
        return repos;
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

  ownerInfo(): Promise<Owner> {
    return this.get({
      path: `users/${this.owner}`,
      headers: {},
      qs: {}
    }).then(response => {
      const { login, name, avatar_url } = response.body;
      return { login, name, avatar: avatar_url };
    });
  }

  statistics(repo: string): Promise<RepoStats> {
    return this.get({
      path: `repos/${this.owner}/${repo}/stats/contributors`,
      headers: {},
      qs: {}
    }).then(response => {
      const { statusCode } = response;
      const { body } = response;

      if (statusCode === 202) {
        return { is_pending: true };
      } else if (statusCode === 200) {
        const authors = body
          .map(authorWeeks => {
            const previousWeekStart = this.period().previous;
            const nextWeekStart = this.period().next;
            const previousWeek = authorWeeks.weeks.filter(
              data => data.w === previousWeekStart
            );
            const nextWeek = authorWeeks.weeks.filter(
              data => data.w === nextWeekStart
            );
            return {
              login: authorWeeks.author.login,
              commits: {
                previous: previousWeek.length === 1 ? previousWeek[0].c : 0,
                next: nextWeek.length === 1 ? nextWeek[0].c : 0
              },
              lines_added: {
                previous: previousWeek.length === 1 ? previousWeek[0].a : 0,
                next: nextWeek.length === 1 ? nextWeek[0].a : 0
              },
              lines_deleted: {
                previous: previousWeek.length === 1 ? previousWeek[0].d : 0,
                next: nextWeek.length === 1 ? nextWeek[0].d : 0
              }
            };
          })
          .filter(
            stats =>
              stats.commits && (stats.commits.previous || stats.commits.next)
          );
        return { is_pending: false, authors };
      }
    });
  }

  issues(repo: string) {
    // TODO(arjun): this can be used for both issues and PRs, which means we cannot
    // differentiate between a closed PR and a merged PR
    const params = {
      path: `repos/${this.owner}/${repo}/issues`,
      qs: {
        state: "all",
        since: this.timeLimit.toISOString()
      }
    };
    return this.getAllPages([], params).then(response => {
      const filtered = response.filter(issue => !issue.pull_request);
      return {
        name: "issues_created",
        values: getComparativeResponse(filtered, "created_at")
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
    return this.getAllForAsc(params, "starred_at").then(response => {
      return getComparativeResponse(response, "starred_at");
    });
  }
}
