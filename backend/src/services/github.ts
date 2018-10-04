import { GithubAPICaller } from "./api";
import { getComparativeCounts, getComparativeDurations } from "./utils";
import * as types from "../types";
import * as moment from "moment";

export default class GithubService extends types.ServiceClient {
  helper: GithubAPICaller;
  periodPrev: moment.Moment;
  periodNext: moment.Moment;

  constructor(
    public token: string,
    public owner: string,
    public weekStart: moment.Moment
  ) {
    super(token, owner, weekStart);
    // We use Sunday-Saturday as the definition of the week
    // This is because of how the Github stats API returns weeks
    this.periodPrev = moment(this.weekStart).subtract(1, "weeks");
    this.periodNext = moment(this.weekStart);
    this.helper = new GithubAPICaller(token, this.periodPrev, this.periodNext);
  }

  report = (): Promise<types.Report> => {
    return Promise.all([this.repos(), this.members()])
      .then(responses => {
        const repos = responses[0];
        const members = responses[1];
        return {
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
  };

  emailReport = async () => {
    const repos = await this.repos();
    const owner = await this.ownerInfo();
    const statsValues = await Promise.all(
      repos.map(repo => this.statsWrapper(repo.name))
    );

    let repoResult: types.RepoWithStats[] = [];
    let index;

    for (index = 0; index < repos.length; index++) {
      const stats = statsValues[index];
      repoResult.push({ ...repos[index], stats });
    }

    const period = { previous: this.periodPrev, next: this.periodNext };
    return { owner, period, repos: repoResult };
  };

  async repos(): Promise<types.Repo[]> {
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

    const result = await this.helper.getAllPages([], params);
    return result
      .filter(repo => moment(repo.updated_at) > this.periodPrev)
      .map(repo => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        is_private: repo.private,
        is_fork: repo.fork,
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at
      }));
  }

  async members(): Promise<types.Member[]> {
    // Uses GraphQL because the REST endpoint does not return full names
    // REST API: https://developer.github.com/v3/orgs/members/#members-list
    const organisation = await this.organisation();
    const { node_id } = organisation;
    const MEMBER_LIMIT = 50;
    const query = `{
      nodes(ids: ["${node_id}"]) {
        ... on Organization {
          members(first: ${MEMBER_LIMIT}) {
            nodes {
              id
              login
              name
              avatarUrl
            }
          }
        }
      }
    }`;
    const response = await this.helper.graphqlPost({ query });
    const { data, errors } = response.body;

    if (!errors) {
      const { nodes: result } = data;
      const { members } = result[0];
      const { nodes: memberNodes } = members;
      return memberNodes.map(node => ({
        login: node.login,
        name: node.name,
        avatar: node.avatarUrl
      }));
    } else {
      // For organisations that have "restricted access" enabled
      // third-party apps cannot run the GraphQL request.
      // Hence, fall back to the old REST endpoint.
      const params = {
        path: `orgs/${this.owner}/members`
      };
      const result = await this.helper.getAllPages([], params);
      return result.map(member => ({
        login: member.login,
        name: member.login,
        avatar: member.avatar_url
      }));
    }
  }

  ownerInfo = async (): Promise<types.Owner> => {
    const response = await this.helper.get({
      path: `users/${this.owner}`,
      headers: {},
      qs: {}
    });
    const { login, name, avatar_url } = response.body;
    return { login, name, avatar: avatar_url };
  };

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

  statistics = (repo: string): Promise<types.RepoStats> => {
    return this.helper
      .get({
        path: `repos/${this.owner}/${repo}/stats/contributors`,
        headers: {},
        qs: {}
      })
      .then(response => {
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
  };

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
    return this.helper.getAllForDesc([], params, "updated_at");
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

  async organisation() {
    const response = await this.helper.get({
      path: `orgs/${this.owner}`,
      headers: {},
      qs: {}
    });
    return response.body;
  }

  prActivity = () => {
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
        return this.helper.graphqlPost({ query }).then(response => {
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
                    author: commentNode.author
                      ? commentNode.author.login
                      : null,
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
  };

  commits(repo: string): Promise<types.RepoCommits[]> {
    // Only default branch (master)
    const params = {
      path: `repos/${this.owner}/${repo}/commits`,
      qs: {
        since: this.periodPrev.toISOString(),
        per_page: 100
      }
    };
    return this.helper.getAllPages([], params).then(values => {
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

  allCommits = (): Promise<types.Commits[]> => {
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
  };
}
