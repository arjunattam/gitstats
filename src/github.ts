import APICaller from "./api";
import { getComparativeCounts, getComparativeDurations } from "./utils";
import * as types from "./types";
import * as moment from "moment";

export default class GithubService extends APICaller {
  report() {
    return Promise.all([this.repos(), this.members(), this.ownerInfo()])
      .then(responses => {
        const repos = responses[0];
        const members = responses[1];
        const owner = responses[2];
        return {
          period: { previous: this.periodPrev, next: this.periodNext },
          owner,
          members,
          repos
        };
      })
      .then(result => {
        const { repos } = result;
        const stats = repos.map(repo => this.statistics(repo.name));

        return Promise.all(stats).then(statsValues => {
          let repoResult = [];
          let index;

          for (index = 0; index < repos.length; index++) {
            repoResult.push({ ...repos[index], stats: statsValues[index] });
          }

          return { ...result, repos: repoResult };
        });
      })
      .then(result => {
        const { repos } = result;
        const pulls = repos.map(repo => this.pulls(repo.name));

        return Promise.all(pulls).then(pullsValues => {
          let repoResult = [];
          let index;

          for (index = 0; index < repos.length; index++) {
            repoResult.push({ ...repos[index], prs: pullsValues[index] });
          }

          return { ...result, repos: repoResult };
        });
      });
  }

  repos(): Promise<types.Repo[]> {
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
    return this.getAllPages([], params).then(repos =>
      repos
        .filter(repo => moment(repo.updated_at) > this.periodPrev)
        .map(repo => ({
          name: repo.name,
          description: repo.description,
          is_private: repo.private,
          is_fork: repo.fork,
          stargazers_count: repo.stargazers_count,
          updated_at: repo.updated_at
        }))
    );
  }

  members(): Promise<types.Member[]> {
    // Doc: https://developer.github.com/v3/orgs/members/#members-list
    // TODO(arjun): this will not work for usernames
    const params = {
      path: `orgs/${this.owner}/members`
    };
    return this.getAllPages([], params).then(members => {
      return members.map(member => ({
        login: member.login,
        name: member.login,
        avatar: member.avatar_url
      }));
    });
  }

  ownerInfo(): Promise<types.Owner> {
    return this.get({
      path: `users/${this.owner}`,
      headers: {},
      qs: {}
    }).then(response => {
      const { login, name, avatar_url } = response.body;
      return { login, name, avatar: avatar_url };
    });
  }

  statistics(repo: string): Promise<types.RepoStats> {
    return this.get({
      path: `repos/${this.owner}/${repo}/stats/contributors`,
      headers: {},
      qs: {}
    }).then(response => {
      const { statusCode } = response;
      const { body } = response;

      if (statusCode === 202) {
        return { is_pending: true };
      } else if (statusCode === 204) {
        return { is_pending: false, authors: [] };
      } else if (statusCode === 200) {
        const authors = body
          .map(result => {
            const periodPrev = this.periodPrev.unix();
            const periodNext = this.periodNext.unix();
            const prevWeek = result.weeks.filter(data => data.w === periodPrev);
            const nextWeek = result.weeks.filter(data => data.w === periodNext);
            return {
              login: result.author.login,
              commits: {
                previous: prevWeek.length === 1 ? prevWeek[0].c : 0,
                next: nextWeek.length === 1 ? nextWeek[0].c : 0
              },
              lines_added: {
                previous: prevWeek.length === 1 ? prevWeek[0].a : 0,
                next: nextWeek.length === 1 ? nextWeek[0].a : 0
              },
              lines_deleted: {
                previous: prevWeek.length === 1 ? prevWeek[0].d : 0,
                next: nextWeek.length === 1 ? nextWeek[0].d : 0
              }
            };
          })
          .filter(
            author =>
              author.commits && (author.commits.next || author.commits.previous)
          );
        return { is_pending: false, authors };
      }
    });
  }

  pulls(repo: string): Promise<types.RepoPR[]> {
    const params = {
      path: `repos/${this.owner}/${repo}/pulls`,
      qs: {
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: 50 // overriding because 100 seems too much for one repo
      }
    };
    return this.getAllForDesc([], params, "updated_at").then(pulls => {
      let authorWisePRs = {};
      pulls.forEach(pull => {
        const author = pull.user.login;
        if (author in authorWisePRs) {
          authorWisePRs[author] = [...authorWisePRs[author], pull];
        } else {
          authorWisePRs[author] = [pull];
        }
      });
      const result = Object.keys(authorWisePRs).map(author => ({
        author,
        prs_opened: getComparativeCounts(authorWisePRs[author], "created_at"),
        prs_merged: getComparativeCounts(authorWisePRs[author], "merged_at"),
        time_to_merge: getComparativeDurations(
          authorWisePRs[author],
          "merged_at",
          "created_at"
        )
      }));
      return result;
    });
  }

  prActivity(repo: string, pr: string) {
    const params = {
      path: `repos/${this.owner}/${repo}/pulls/${pr}`,
      qs: {},
      headers: {}
    };
    return this.get(params)
      .then(response => {
        const {
          user,
          title,
          state,
          created_at,
          updated_at,
          closed_at,
          merged,
          additions,
          deletions,
          changed_files,
          merged_at,
          _links
        } = response.body;
        return {
          title,
          state,
          created_at,
          updated_at,
          closed_at,
          merged,
          additions,
          deletions,
          changed_files,
          merged_at,
          url: _links.html.href,
          author: user.login
        };
      })
      .then(response => {
        const params = {
          path: `repos/${this.owner}/${repo}/pulls/${pr}/commits`,
          qs: {},
          headers: {}
        };
        // TODO(arjun): add commit author to this
        return this.getAllPages([], params).then(values => {
          return {
            ...response,
            commits: values.map(commit => ({
              sha: commit.sha,
              date: commit.commit.author.date
            }))
          };
        });
      })
      .then(response => {
        const params = {
          path: `repos/${this.owner}/${repo}/pulls/${pr}/comments`,
          qs: {},
          headers: {}
        };
        return this.getAllPages([], params).then(values => {
          return {
            ...response,
            comments: values.map(comment => ({
              author: comment.user.login,
              date: comment.created_at
            }))
          };
        });
      });
  }

  issues(repo: string) {
    // TODO(arjun): this can be used for both issues and PRs, which means we cannot
    // differentiate between a closed PR and a merged PR
    const params = {
      path: `repos/${this.owner}/${repo}/issues`,
      qs: {
        state: "all",
        since: this.periodPrev.toISOString()
      }
    };
    return this.getAllPages([], params).then(response => {
      const filtered = response.filter(issue => !issue.pull_request);
      return {
        name: "issues_created",
        values: getComparativeCounts(filtered, "created_at")
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
      return getComparativeCounts(response, "starred_at");
    });
  }

  commits(repo: string): Promise<types.RepoCommits[]> {
    // Only default branch (master)
    const params = {
      path: `repos/${this.owner}/${repo}/commits`,
      qs: {
        since: this.periodPrev.toISOString(),
        per_page: 100
      }
    };
    return this.getAllPages([], params).then(values => {
      const commits = values.map(response => ({
        // TODO: should we use committer or author?
        // https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
        login: response.author.login,
        date: response.commit.author.date,
        message: response.commit.message,
        sha: response.sha
      }));
      let authorWiseCommits = {};
      commits.forEach(commit => {
        const { login } = commit;
        if (login in authorWiseCommits) {
          authorWiseCommits[login] = [commit, ...authorWiseCommits[login]];
        } else {
          authorWiseCommits[login] = [commit];
        }
      });
      const authors = Object.keys(authorWiseCommits);
      return authors.map(author => ({
        author,
        commits: authorWiseCommits[author]
      }));
    });
  }

  allCommits(): Promise<types.Commits[]> {
    return this.repos().then(repos => {
      // Filtering to public repos only because the Github Apps
      // integration does not ask for commits permissions.
      const filtered = repos.filter(repo => !repo.is_private);
      const promises = filtered.map(repo => this.commits(repo.name));
      return Promise.all(promises).then((responses: types.RepoCommits[][]) => {
        return responses.map((response, idx) => ({
          repo: filtered[idx].name,
          commits: response
        }));
      });
    });
  }
}
