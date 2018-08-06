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

  emailReport() {
    return this.repos()
      .then(repos => {
        const stats = repos.map(repo => this.statsWrapper(repo.name));

        return Promise.all(stats).then(statsValues => {
          let repoResult = [];
          let index;

          for (index = 0; index < repos.length; index++) {
            const stats = statsValues[index];
            repoResult.push({ ...repos[index], stats });
          }

          const period = { previous: this.periodPrev, next: this.periodNext };
          return { period, repos: repoResult };
        });
      })
      .then(report => {
        return this.ownerInfo().then(owner => {
          return {
            ...report,
            owner
          };
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

  statsWrapper(repo: string): Promise<types.RepoStats> {
    return new Promise(resolve => {
      this.statsHelper(resolve, repo);
    });
  }

  statsHelper(resolve, repo) {
    this.statistics(repo).then(response => {
      const { is_pending } = response;

      if (!is_pending) {
        resolve(response);
      } else {
        setTimeout(() => {
          this.statsHelper(resolve, repo);
        }, 500);
      }
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
        const allWeeks = [0, 1, 2, 3, 4].map(value =>
          moment(this.periodNext)
            .subtract(value, "weeks")
            .unix()
        );
        const getAttr = (weeksData, ts, attrKey) => {
          const filtered = weeksData.filter(data => data.w === ts);
          const value = filtered.length > 0 ? filtered[0][attrKey] : 0;
          return {
            week: ts,
            value
          };
        };

        const authors = body
          .map(result => {
            const { author, weeks } = result;
            return {
              login: author.login,
              commits: allWeeks.map(ts => getAttr(weeks, ts, "c")),
              lines_added: allWeeks.map(ts => getAttr(weeks, ts, "a")),
              lines_deleted: allWeeks.map(ts => getAttr(weeks, ts, "d"))
            };
          })
          .filter(author => !!author.commits);
        return { is_pending: false, authors };
      }
    });
  }

  pullsList(repo: string) {
    const params = {
      path: `repos/${this.owner}/${repo}/pulls`,
      qs: {
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: 50 // overriding because 100 seems too much for one repo
      }
    };
    return this.getAllForDesc([], params, "updated_at");
  }

  pulls(repo: string): Promise<types.RepoPR[]> {
    return this.pullsList(repo).then(pulls => {
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

  organisation() {
    return this.get({ path: `orgs/${this.owner}`, headers: {}, qs: {} }).then(
      response => response.body
    );
  }

  prActivity() {
    return this.organisation()
      .then(({ node_id }) => {
        // TODO - this sets a limit of 10 for repos and limit of 20 for PRs
        return `{
      nodes(ids: ["${node_id}"]) {
        ... on Organization {
          repositories(first: 10, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              name
              updatedAt
              pullRequests(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
                nodes {
                  author {
                    login
                  }
                  updatedAt
                  createdAt
                  mergedAt
                  closedAt
                  state
                  title
                  number
                  url
                  comments(first: 50) {
                    nodes {
                      createdAt
                      author {
                        login
                      }
                    }
                  }
                  commits(first: 50) {
                    nodes {
                      commit {
                        message
                        authoredDate
                        author {
                          email
                          user {
                            login
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;
      })
      .then(query => {
        return this.graphqlPost({ query }).then(response => {
          const responseNode = response.body.data.nodes[0];
          return responseNode.repositories.nodes
            .filter(
              node =>
                moment(node.updatedAt) > this.periodPrev &&
                node.pullRequests.nodes.length > 0
            )
            .map(node => {
              const pulls = node.pullRequests.nodes
                .filter(prNode => moment(prNode.updatedAt) > this.periodPrev)
                .map(prNode => {
                  const commits = prNode.commits.nodes
                    // TODO - we are filtering for only recognised committers
                    .filter(
                      commitNode =>
                        !!commitNode && !!commitNode.commit.author.user
                    )
                    .map(commitNode => ({
                      author: commitNode.commit.author.user.login,
                      date: commitNode.commit.authoredDate,
                      message: commitNode.commit.message
                    }));
                  // TODO: the comments does not include approval/rejection comments
                  // eg, in this PR: https://github.com/getsentry/responses/pull/210
                  // TODO: should this return message also?
                  const comments = prNode.comments.nodes.map(commentNode => ({
                    author: commentNode.author.login,
                    date: commentNode.createdAt
                  }));
                  return {
                    author: prNode.author.login,
                    title: prNode.title,
                    number: prNode.number,
                    created_at: prNode.createdAt,
                    merged_at: prNode.mergedAt,
                    closed_at: prNode.closedAt,
                    updated_at: prNode.updatedAt,
                    state: prNode.state,
                    url: prNode.url,
                    comments,
                    commits
                  };
                });
              return {
                repo: node.name,
                pulls
              };
            });
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
      const commits = values
        .filter(response => !!response.author)
        .map(response => ({
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
