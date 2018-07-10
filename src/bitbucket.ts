import * as moment from "moment";
import * as types from "./types";
const rp = require("request-promise-native");
import { getComparativeDurations, getComparativeCounts } from "./utils";

export default class BitbucketService {
  baseUrl: string;
  periodPrev: moment.Moment;
  periodNext: moment.Moment;

  constructor(private token: string, private owner: string) {
    this.baseUrl = "https://api.bitbucket.org/2.0/";

    // We use Sunday-Saturday as the definition of the week
    // This is because of how the Github stats API returns weeks
    this.periodPrev = moment()
      .utc()
      .startOf("week")
      .subtract(2, "weeks");
    this.periodNext = moment()
      .utc()
      .startOf("week")
      .subtract(1, "weeks");
  }

  get({ path, qs }) {
    return rp({
      baseUrl: this.baseUrl,
      uri: path,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      qs,
      json: true
    });
  }

  report() {
    return Promise.all([this.repos(), this.members(), this.ownerInfo()])
      .then(responses => {
        return {
          period: { previous: this.periodPrev, next: this.periodNext },
          owner: responses[2],
          members: responses[1],
          repos: responses[0]
        };
      })
      .then(response => {
        const { repos } = response;
        const prs = repos.map(repo => this.pulls(repo.name));
        return Promise.all(prs).then(pullsValues => {
          let repoResult = [];
          let index;

          for (index = 0; index < repos.length; index++) {
            repoResult.push({ ...repos[index], prs: pullsValues[index] });
          }

          return {
            ...response,
            repos: repoResult
          };
        });
      })
      .then(response => {
        const { repos } = response;
        const commits = repos.map(repo => this.commits(repo.name));
        return Promise.all(commits).then(responses => {
          let repoResult = [];
          let index;

          for (index = 0; index < repos.length; index++) {
            repoResult.push({ ...repos[index], stats: responses[index] });
          }

          return {
            ...response,
            repos: repoResult
          };
        });
      });
  }

  repos(): Promise<types.Repo[]> {
    return this.get({
      path: `repositories/${this.owner}`,
      qs: { role: "member" } // TODO add filtering and sorting
    }).then(response => {
      // TODO: pagination
      const { values } = response;
      return values.map(repo => ({
        name: repo.slug,
        description: repo.description,
        is_private: repo.is_private,
        is_fork: false, // bitbucket?
        stargazers_count: 0, // bitbucket?
        updated_at: repo.updated_on
      }));
    });
  }

  members(): Promise<types.Member[]> {
    return this.get({
      path: `teams/${this.owner}/members`,
      qs: { role: "member" }
    }).then(response => {
      // TODO: pagination
      const { values } = response;
      return values.map(member => ({
        login: member.username,
        avatar: member.links.avatar
      }));
    });
  }

  ownerInfo(): Promise<types.Owner> {
    return this.get({
      path: `teams/${this.owner}`,
      qs: {}
    }).then(team => ({
      login: team.username,
      name: team.display_name,
      avatar: team.links.avatar
    }));
  }

  pulls(repo: string): Promise<types.RepoPR[]> {
    return this.get({
      path: `repositories/${this.owner}/${repo}/pullrequests`,
      // TODO: MERGED, SUPERSEDED, OPEN, DECLINED -- need to repeat state
      qs: { state: "MERGED" }
      // TODO: add time filtering
    }).then(response => {
      const { values } = response;
      let authorWisePRs = {};
      values.forEach(pr => {
        const { username } = pr.author;
        const prObject = {
          state: pr.state,
          createdAt: pr.created_on,
          // TODO: not sure if updated is a good proxy for merged_at
          // we can use the time of the merge commit
          updatedAt: pr.updated_on
        };

        if (username in authorWisePRs) {
          authorWisePRs[username] = [].concat(
            prObject,
            ...authorWisePRs[username]
          );
        } else {
          authorWisePRs[username] = [prObject];
        }
      });

      return Object.keys(authorWisePRs).map(author => {
        const pulls = authorWisePRs[author];
        return {
          author,
          prs_opened: getComparativeCounts(pulls, "createdAt"),
          prs_merged: getComparativeCounts(
            pulls.filter(p => p.state === "MERGED"),
            "updatedAt"
          ),
          time_to_merge: getComparativeDurations(
            pulls.filter(p => p.state === "MERGED"),
            "updatedAt",
            "createdAt"
          )
        };
      });
    });
  }

  commits(repo: string) {
    return this.get({
      path: `repositories/${this.owner}/${repo}/commits`,
      qs: {} // TODO filtering
    }).then(response => {
      const { values } = response;
      let authorWiseCommits = {};

      values.forEach(commit => {
        const { username } = commit.author.user;
        const commitObject = { date: commit.date };

        if (username in authorWiseCommits) {
          authorWiseCommits[username] = [].concat(
            commitObject,
            ...authorWiseCommits[username]
          );
        } else {
          authorWiseCommits[username] = [commitObject];
        }
      });

      const authors = Object.keys(authorWiseCommits).map(author => ({
        commits: getComparativeCounts(authorWiseCommits[author], "date"),
        lines_added: { previous: 0, next: 0 }, // TODO: get lines
        lines_deleted: { previous: 0, next: 0 } // TODO: get lines
      }));
      return {
        is_pending: false,
        authors
      };
    });
  }
}
