import * as moment from "moment";
import * as types from "./types";
const rp = require("request-promise-native");
const url = require("url");
import { getComparativeDurations, getComparativeCounts } from "./utils";

export default class BitbucketService extends types.ServiceClient {
  baseUrl: string;
  periodPrev: moment.Moment;
  periodNext: moment.Moment;

  constructor(
    public token: string,
    public owner: string,
    public weekStart: moment.Moment
  ) {
    super(token, owner, weekStart);
    this.baseUrl = "https://api.bitbucket.org/2.0/";

    // We use Sunday-Saturday as the definition of the week
    // This is because of how the Github stats API returns weeks
    this.periodPrev = moment(this.weekStart).subtract(1, "weeks");
    this.periodNext = moment(this.weekStart);
  }

  isInDuration(date: string, minDateValue) {
    return (
      moment(date) > minDateValue &&
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

  // This method accesses arbitrarily nested property of an object
  // Source https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
  access = (p, o) => p.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

  getAllTillDate({ path, qs }, aggregateValues, key, minDateValue) {
    // Assumes the response is sorted in desc by key (which is true for commits)
    // key can be a nested field (using .) or a combination of fields (using ,)
    // eg, key as update.date,comment.created_on checks for two nested fields
    return this.get({ path, qs }).then(response => {
      const { values, next } = response;
      const filtered = values.filter(value => {
        const allKeys = key.split(",");
        let keyValue;

        allKeys.forEach(key => {
          const result = this.access(key.split("."), value);
          if (result) {
            keyValue = result;
          }
        });

        return !keyValue || moment(keyValue) > minDateValue;
      });

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
          key,
          minDateValue
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

  report = () => {
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
  };

  emailReport = () => {
    return Promise.all([this.repos(), this.ownerInfo()])
      .then(responses => {
        return {
          period: { previous: this.periodPrev, next: this.periodNext },
          owner: responses[1],
          repos: responses[0]
        };
      })
      .then(response => {
        const { repos } = response;
        const stats = repos.map(repo => this.statistics(repo.name));
        return Promise.all(stats).then(statsValues => {
          let repoResult = [];
          let index;

          for (index = 0; index < repos.length; index++) {
            repoResult.push({ ...repos[index], stats: statsValues[index] });
          }

          return {
            ...response,
            repos: repoResult
          };
        });
      });
  };

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
        qs: {}
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

  pullsApi(repo: string) {
    return this.getAll(
      {
        path: `repositories/${this.owner}/${repo}/pullrequests`,
        qs: {
          ...this.getCommonQs(),
          fields: `-values.description,-values.destination,-values.summary,-values.source,-values.closed_by`,
          state: this.buildRepeatedQs("state", [
            "MERGED",
            "SUPERSEDED",
            "OPEN",
            "DECLINED"
          ])
        }
      },
      []
    );
  }

  pulls(repo: string): Promise<types.RepoPR[]> {
    return this.pullsApi(repo).then(values => {
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

  repoPRActivity(repo: string) {
    const periodStart = this.periodPrev;
    return this.pullsApi(repo)
      .then(pulls => {
        return pulls
          .filter(pr => moment(pr.updated_on) > periodStart)
          .map(pr => ({
            author: pr.author.username,
            title: pr.title,
            number: pr.id,
            created_at: pr.created_on,
            merged_at: pr.state === "MERGED" ? pr.updated_on : null,
            closed_at: pr.state === "MERGED" ? pr.updated_on : null,
            updated_at: pr.updated_on,
            state: pr.state,
            url: pr.links.html.href
          }));
      })
      .then(pulls => {
        const params = {
          path: `repositories/${this.owner}/${repo}/pullrequests/activity`,
          qs: {}
        };
        return this.getAllTillDate(
          params,
          [],
          "update.date,comment.created_on",
          this.periodPrev
        ).then(result => {
          // result has comments, commits (update), approvals
          return pulls.map(pr => ({
            ...pr,
            commits: result
              .filter(value => {
                const { update, pull_request } = value;
                return !!update && pull_request.id === pr.number;
              })
              .map(value => ({
                date: value.update.date,
                author: value.update.author
                  ? value.update.author.username
                  : null
              })),
            comments: result
              .filter(value => {
                const { comment, pull_request } = value;
                return !!comment && pull_request.id === pr.number;
              })
              .map(value => ({
                date: value.comment.created_on,
                author: value.comment.user.username
              }))
          }));
        });
      });
  }

  prActivity = () => {
    return this.repos().then(repos => {
      const promises = repos.map(repo => this.repoPRActivity(repo.name));
      return Promise.all(promises).then(responses => {
        return repos.map((repo, idx) => ({
          repo: repo.name,
          pulls: responses[idx]
        }));
      });
    });
  };

  statistics = (repo: string) => {
    const minDateValue = moment(this.periodNext).subtract(4, "weeks");

    return this.commits(repo, minDateValue).then(response => {
      const authors = Object.keys(response);
      const result: types.AuthorStats[] = authors.map(author => {
        const commits = response[author];

        const commitsResult = [0, 1, 2, 3, 4].map(value => {
          const start = moment(this.periodNext).subtract(value, "weeks");
          const end = moment(start).add(1, "weeks");
          return {
            week: start.unix(),
            value: commits.filter(
              c => moment(c.date) > start && moment(c.date) < end
            ).length
          };
        });

        return {
          login: author,
          commits: commitsResult,
          lines_added: [],
          lines_deleted: []
        };
      });

      return { is_pending: false, authors: result };
    });
  };

  commits(repo: string, minDateValue: moment.Moment) {
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
      "date",
      minDateValue
    ).then(values => {
      let authorWiseCommits = {};
      values.forEach(commit => {
        const { date } = commit;
        const isInDuration = this.isInDuration(date, minDateValue);
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

  allCommits = (): Promise<types.Commits[]> => {
    return this.repos().then(repos => {
      const promises = repos.map(repo =>
        this.commits(repo.name, this.periodPrev)
      );
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
  };

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
