import * as moment from "moment";
import * as types from "./types";
const rp = require("request-promise-native");
const url = require("url");
import { getComparativeDurations, getComparativeCounts } from "./utils";

export default class BitbucketService {
  baseUrl: string;
  periodPrev: moment.Moment;
  periodNext: moment.Moment;

  constructor(private token: string, private owner: string) {
    this.baseUrl = "https://api.bitbucket.org/2.0/";

    // We use Sunday-Saturday as the definition of the week
    // This is because of how the Github stats API returns weeks
    this.periodPrev = moment() // this is the last timestamp
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

  getAll({ path, qs }, aggregateValues) {
    return this.get({ path, qs }).then(response => {
      const { values, next } = response;
      const newAggregate = [...aggregateValues, ...values];

      if (next) {
        const { query } = url.parse(next, true);
        return this.getAll({ path, qs: { ...qs, ...query } }, newAggregate);
      } else {
        return newAggregate;
      }
    });
  }

  getAllTillDate({ path, qs }, aggregateValues, key) {
    // Assumes the response is sorted in desc by key (which is true for commits)
    return this.get({ path, qs }).then(response => {
      const { values, next } = response;
      const filtered = values.filter(
        value => moment(value[key]) > this.periodPrev
      );

      if (filtered.length < values.length) {
        // We have all the data
        const newAggregate = [...aggregateValues, ...filtered];
        return newAggregate;
      }

      // We will need next page if available
      const newAggregate = [...aggregateValues, ...values];

      if (next) {
        const { query } = url.parse(next, true);
        return this.getAllTillDate(
          { path, qs: { ...qs, ...query } },
          newAggregate,
          key
        );
      } else {
        return newAggregate;
      }
    });
  }

  getCommonQs() {
    const lastDate = this.periodPrev.toISOString().substr(0, 10);
    return { sort: "-updated_on", q: `updated_on>=${lastDate}` };
  }

  buildRepeatedQs(key, values) {
    // eg, state=OPEN&state=MERGED&state=DECLINED&state=SUPERSEDED
    // This method will return "OPEN&state=MERGED&state=DECLINED&state=SUPERSEDED"
    return values.join(`&${key}=`);
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
    return this.getAll(
      {
        path: `repositories/${this.owner}`,
        qs: { ...this.getCommonQs() }
      },
      []
    ).then(values => {
      return values.map(repo => ({
        name: repo.slug,
        description: repo.description,
        is_private: repo.is_private,
        is_fork: false,
        stargazers_count: 0,
        updated_at: repo.updated_on
      }));
    });
  }

  members(): Promise<types.Member[]> {
    return this.getAll(
      {
        path: `teams/${this.owner}/members`,
        qs: { role: "member" }
      },
      []
    ).then(values => {
      return values.map(member => ({
        login: member.username,
        name: member.display_name,
        avatar: member.links.avatar.href
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
      avatar: team.links.avatar.href
    }));
  }

  pulls(repo: string): Promise<types.RepoPR[]> {
    return this.getAll(
      {
        path: `repositories/${this.owner}/${repo}/pullrequests`,
        qs: {
          ...this.getCommonQs(),
          fields: `-values.description,-values.links,-values.destination,-values.summary,-values.source,-values.closed_by`,
          state: this.buildRepeatedQs("state", [
            "MERGED",
            "SUPERSEDED",
            "OPEN",
            "DECLINED"
          ])
        }
      },
      []
    ).then(values => {
      let authorWisePRs = {};
      values.forEach(pr => {
        const { username } = pr.author;
        if (username in authorWisePRs) {
          authorWisePRs[username] = [].concat(pr, ...authorWisePRs[username]);
        } else {
          authorWisePRs[username] = [pr];
        }
      });

      // TODO: not sure if updated is a good proxy for merged_at
      // we can use the time of the merge commit
      return Object.keys(authorWisePRs).map(author => {
        const pulls = authorWisePRs[author];
        return {
          author,
          prs_opened: getComparativeCounts(pulls, "created_on"),
          prs_merged: getComparativeCounts(
            pulls.filter(p => p.state === "MERGED"),
            "updated_on"
          ),
          time_to_merge: getComparativeDurations(
            pulls.filter(p => p.state === "MERGED"),
            "updated_on",
            "created_on"
          )
        };
      });
    });
  }

  commits(repo: string) {
    return this.getAllTillDate(
      {
        path: `repositories/${this.owner}/${repo}/commits`,
        qs: {
          // does not support filtering: https://developer.atlassian.com/bitbucket/api/2/reference/meta/filtering
          fields: `-values.repository,-values.links,-values.summary,-values.parents`
        }
      },
      [],
      "date"
    ).then(values => {
      let authorWiseCommits = {};
      values.forEach(commit => {
        const { user, raw } = commit.author;
        // This user might not have a linked bitbucket account
        // eg, raw is `Tarun Gupta <tarungupta@Taruns-MacBook-Pro.local>`
        // We will try to match it with a member -- TODO
        if (user) {
          const { username } = user;
          const commitObject = { date: commit.date };
          if (username in authorWiseCommits) {
            authorWiseCommits[username] = [].concat(
              commitObject,
              ...authorWiseCommits[username]
            );
          } else {
            authorWiseCommits[username] = [commitObject];
          }
        }
      });

      const authors = Object.keys(authorWiseCommits).map(author => ({
        login: author,
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
