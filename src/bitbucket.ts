import * as moment from "moment";
import * as types from "./types";
const rp = require("request-promise-native");
const url = require("url");
import {
  getComparativeDurations,
  getComparativeCounts,
  getComparativeSums
} from "./utils";

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

  isInDuration(date: string) {
    return (
      moment(date) > this.periodPrev &&
      moment(date) <
        moment()
          .utc()
          .startOf("week")
    );
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
        updated_at: repo.updated_on,
        stats: { is_pending: true }
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

  statistics(repo: string) {
    return this.commits(repo).then(response => {
      // response is an object with key as author and value as commit[]
      const authors = Object.keys(response);
      const promises = authors.map(author => {
        const commits = response[author];
        return this.diffstat(repo, commits);
      });

      return Promise.all(promises).then(responses => {
        // Each response is an array of { hash, date, added, deleted }
        // for corresponding author
        let result: types.AuthorStats[] = [];
        let index;
        for (index = 0; index < authors.length; index++) {
          result.push({
            login: authors[index],
            commits: getComparativeCounts(responses[index], "date"),
            lines_added: getComparativeSums(responses[index], "date", "added"),
            lines_deleted: getComparativeSums(
              responses[index],
              "date",
              "deleted"
            )
          });
        }
        return { is_pending: false, authors: result };
      });
    });
  }

  commits(repo: string) {
    // Returns all commits in the repo, all branches
    // https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/commits
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
        const { date } = commit;
        const isInDuration = this.isInDuration(date);
        const { user, raw } = commit.author;
        // This user might not have a linked bitbucket account
        // eg, raw is `Tarun Gupta <tarungupta@Taruns-MacBook-Pro.local>`
        // We will try to match it with a member -- TODO
        if (user && isInDuration) {
          const { username } = user;
          if (username in authorWiseCommits) {
            authorWiseCommits[username] = [].concat(
              commit,
              ...authorWiseCommits[username]
            );
          } else {
            authorWiseCommits[username] = [commit];
          }
        }
      });

      return authorWiseCommits;
    });
  }

  allCommits(): Promise<types.Commits[]> {
    return this.repos().then(repos => {
      const promises = repos.map(repo => this.commits(repo.name));
      return Promise.all(promises).then(responses => {
        return responses.map((response, idx) => {
          const authors = Object.keys(response);
          let result = [];
          authors.forEach(author => {
            const commits = response[author].map(commit => ({
              date: commit.date,
              sha: commit.hash,
              message: commit.message
            }));
            result.push({ author, commits });
          });
          return {
            repo: repos[idx].name,
            commits: result
          };
        });
      });
    });
  }

  diffstat(repo: string, commits: any[]) {
    // Each commit has hash and date
    const promises = commits.map(commit =>
      this.getAll(
        {
          path: `repositories/${this.owner}/${repo}/diffstat/${commit.hash}`,
          qs: { fields: `-values.old,-values.new,-values.type` }
        },
        []
      ).then(values => {
        const initial = { added: 0, deleted: 0 };
        return values.reduce(
          (acc, current) => ({
            added: acc.added + current.lines_added,
            deleted: acc.deleted + current.lines_removed
          }),
          initial
        );
      })
    );
    return Promise.all(promises).then(values => {
      let result = [];
      let index;
      for (index = 0; index < commits.length; index++) {
        result.push({ ...commits[index], ...values[index] });
      }
      return result;
    });
  }
}
