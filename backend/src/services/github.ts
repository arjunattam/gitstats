import { GithubAPICaller } from "./api";
import * as types from "../types";
import * as moment from "moment";
import { ITeam, IRepo, IMember, ICommit } from "gitstats-shared";
import { ServiceClient } from "./base";

const STATUS_CODES = {
  success: 200,
  pending: 202,
  noContent: 204
};

export default class GithubService extends ServiceClient {
  helper: GithubAPICaller;

  constructor(
    public token: string,
    public owner: string,
    public weekStart: moment.Moment
  ) {
    super(token, owner, weekStart);
    this.helper = new GithubAPICaller(token, this.periodPrev, this.periodNext);
  }

  repos = async (): Promise<IRepo[]> => {
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
  };

  members = async (): Promise<IMember[]> => {
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
  };

  ownerInfo = async (): Promise<ITeam> => {
    const response = await this.helper.get({
      path: `users/${this.owner}`,
      headers: {},
      qs: {}
    });
    const { login, name, avatar_url } = response.body;
    return { login, name, avatar: avatar_url, service: "github" };
  };

  statistics = async (repo: string): Promise<types.RepoStats> => {
    const response = await this.helper.get({
      path: `repos/${this.owner}/${repo}/stats/contributors`,
      headers: {},
      qs: {}
    });
    const { statusCode, body } = response;

    if (statusCode === STATUS_CODES.pending) {
      return { is_pending: true };
    } else if (statusCode === STATUS_CODES.noContent) {
      return { is_pending: false, authors: [] };
    } else if (statusCode === STATUS_CODES.success) {
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

      const sumOfValues = input => {
        const values = input.map(({ week, value }) => value);
        return values.reduce((acc, current) => acc + current, 0);
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
        .filter(author => sumOfValues(author.commits) > 0);

      return { is_pending: false, authors };
    }
  };

  private async organisation() {
    const response = await this.helper.get({
      path: `orgs/${this.owner}`,
      headers: {},
      qs: {}
    });
    return response.body;
  }

  private async repository(repo: string) {
    const response = await this.helper.get({
      path: `repos/${this.owner}/${repo}`,
      headers: {},
      qs: {}
    });
    return response.body;
  }

  private async commits(repo: string): Promise<types.RepoCommits[]> {
    // Only default branch (master). Add ?sha=develop to get commits from other branches
    const params = {
      path: `repos/${this.owner}/${repo}/commits`,
      qs: {
        since: this.periodPrev.toISOString(),
        per_page: 100
      }
    };

    const values = await this.helper.getAllPages([], params);
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
  }

  pullsV2 = async (repo: string) => {
    const { node_id } = await this.repository(repo);
    // MDEwOlJlcG9zaXRvcnkxMzgyOTEwMzA=
    console.log("repo id", node_id);
    const query = `{
      nodes(ids: ["${node_id}"]) {
        id
        ... on Repository {
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
    }`;
    const response = await this.helper.graphqlPost({ query });
    const responseNode = response.body.data.nodes[0];

    const pulls = responseNode.pullRequests.nodes
      .filter(prNode => moment(prNode.updatedAt) > this.periodPrev)
      .map(prNode => {
        const commits = prNode.commits.nodes
          // TODO: we are filtering for only recognised committers
          .filter(commitNode => !!commitNode && !!commitNode.commit.author.user)
          .map(commitNode => ({
            author: commitNode.commit.author.user.login,
            date: commitNode.commit.authoredDate,
            message: commitNode.commit.message
          }));

        // TODO: the comments does not include approval/rejection comments
        // eg, in this PR: https://github.com/getsentry/responses/pull/210
        // TODO: should this return message also?
        const comments = prNode.comments.nodes.map(commentNode => ({
          author: commentNode.author ? commentNode.author.login : null,
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

    return { repo, pulls };
  };

  commitsV2 = async (repo: string) => {
    const { is_pending, authors: authorStats } = await this.statistics(repo);

    if (is_pending) {
      return {
        repo,
        is_pending,
        stats: [],
        commits: []
      };
    }

    const stats = authorStats.map(author => ({
      author: author.login,
      commits: author.commits
    }));
    const repoCommits = await this.commits(repo);

    let commitsResult: ICommit[] = [];
    repoCommits.forEach(repoCommit => {
      const { author, commits } = repoCommit;
      commitsResult = [
        ...commitsResult,
        ...commits.map(commit => ({ author, ...commit }))
      ];
    });

    return {
      repo,
      is_pending,
      stats,
      commits: commitsResult
    };
  };
}
