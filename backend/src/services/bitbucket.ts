import * as moment from "moment";
import * as rp from "request-promise-native";
import * as url from "url";
import {
  ITeam,
  IRepo,
  IMember,
  IComment,
  IPullRequest,
  IPullsAPIResult,
  ICommitsAPIResult,
  IRepoStats,
  ICommit,
  IPeriod
} from "gitstats-shared";
import { ServiceClient } from "./base";

export default class BitbucketService extends ServiceClient {
  baseUrl: string = "https://api.bitbucket.org/2.0/";

  private isInDuration(date: string, minDateValue: moment.Moment) {
    const maxDateValue = moment(this.period.current.end);
    return moment(date) > minDateValue && moment(date) < maxDateValue;
  }

  private get({ path, qs }: { path: string; qs: any }) {
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

  private async getAll({ path, qs }, aggregateValues) {
    const response = await this.get({ path, qs });
    const { values, next } = response;
    const newAggregate = [...aggregateValues, ...values];

    if (next) {
      const { query } = url.parse(next, true);
      return this.getAll({ path, qs: { ...qs, ...query } }, newAggregate);
    } else {
      return newAggregate;
    }
  }

  // This method accesses arbitrarily nested property of an object
  // Source https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
  private access = (p, o) =>
    p.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

  private async getAllTillDate(
    { path, qs },
    aggregateValues: any[],
    key: string,
    minDateValue: moment.Moment
  ) {
    // Assumes the response is sorted in desc by key (which is true for commits)
    // key can be a nested field (using .) or a combination of fields (using ,)
    // eg, key as update.date,comment.created_on checks for two nested fields
    const response = await this.get({ path, qs });
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
  }

  private getCommonQueryParams() {
    const previousStart = this.period.previous.start;
    const lastDate = previousStart.substr(0, 10);
    return { sort: "-updated_on", q: `updated_on>=${lastDate}` };
  }

  private buildRepeatedQueryParams(key, values) {
    // eg, state=OPEN&state=MERGED&state=DECLINED&state=SUPERSEDED
    // This method will return "OPEN&state=MERGED&state=DECLINED&state=SUPERSEDED"
    return values.join(`&${key}=`);
  }

  repos = async (): Promise<IRepo[]> => {
    const values = await this.getAll(
      {
        path: `repositories/${this.owner}`,
        qs: { ...this.getCommonQueryParams() }
      },
      []
    );
    return values.map(repo => ({
      name: repo.slug,
      url: repo.links.html.href,
      description: repo.description,
      is_private: repo.is_private,
      is_fork: false,
      stargazers_count: 0,
      updated_at: repo.updated_on,
      stats: { is_pending: true }
    }));
  };

  members = async (): Promise<IMember[]> => {
    const values = await this.getAll(
      {
        path: `teams/${this.owner}/members`,
        qs: {}
      },
      []
    );
    return values.map(member => ({
      login: member.username,
      name: member.display_name,
      avatar: member.links.avatar.href
    }));
  };

  ownerInfo = async (): Promise<ITeam> => {
    const team = await this.get({
      path: `teams/${this.owner}`,
      qs: {}
    });
    return {
      login: team.username,
      name: team.display_name,
      avatar: team.links.avatar.href,
      service: "bitbucket"
    };
  };

  private pullsApi(repo: string) {
    return this.getAll(
      {
        path: `repositories/${this.owner}/${repo}/pullrequests`,
        qs: {
          ...this.getCommonQueryParams(),
          fields: `-values.description,-values.destination,-values.summary,-values.source,-values.closed_by`,
          state: this.buildRepeatedQueryParams("state", [
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

  private async prActivityApi(repo: string) {
    const params = {
      path: `repositories/${this.owner}/${repo}/pullrequests/activity`,
      qs: {}
    };
    const previousStart = moment(this.period.previous.start);
    const response = await this.getAllTillDate(
      params,
      [],
      "update.date,comment.created_on",
      previousStart
    );
    return response;
  }

  private getCommitsFromActivity(prNumber, prActivity: any[]): ICommit[] {
    // This returns one extra commit around when the PR is opened
    // TODO: Can we filter by unique commit SHA?
    return prActivity
      .filter(value => {
        const { update, pull_request } = value;
        return !!update && pull_request.id === prNumber;
      })
      .filter(value => {
        const { update } = value;
        return update.state === "OPEN";
      })
      .map(({ update }) => {
        const { source, author, date } = update;
        return {
          date,
          message: "",
          sha: source && source.commit ? source.commit.hash : null,
          author: author ? author.username : null
        };
      });
  }

  private getCommentsFromActivity(prNumber, prActivity: any[]): IComment[] {
    const relevantActivity = prActivity.filter(
      ({ pull_request }) => pull_request.id === prNumber
    );

    const plainComments = relevantActivity
      .filter(({ comment }) => !!comment)
      .map(({ comment }) => ({
        date: comment.created_on,
        author: comment.user.username,
        type: "comment" as "comment"
      }));

    const mergeComments = relevantActivity
      .filter(({ update }) => !!update && update.state === "MERGED")
      .map(({ update }) => {
        const { date, author } = update;
        return {
          date,
          author: author ? author.username : null,
          type: "merged" as "merged"
        };
      });

    const approvedComments = relevantActivity
      .filter(({ approval }) => !!approval)
      .map(({ approval }) => {
        const { date, user } = approval;
        return {
          date,
          author: user ? user.username : null,
          type: "approved" as "approved"
        };
      });

    const declinedComments = relevantActivity
      .filter(({ update }) => !!update && update.state === "DECLINED")
      .map(({ update }) => {
        const { date, author } = update;
        return {
          date,
          author: author ? author.username : null,
          type: "declined" as "declined"
        };
      });

    return [
      ...plainComments,
      ...mergeComments,
      ...approvedComments,
      ...declinedComments
    ];
  }

  pulls = async (repo: string): Promise<IPullsAPIResult> => {
    const responses = await Promise.all([
      this.pullsApi(repo),
      this.prActivityApi(repo)
    ]);
    const pulls = responses[0];
    const prActivity = responses[1];
    const filteredPulls = pulls
      .filter(
        (pr: any) => moment(pr.updated_on) > moment(this.period.previous.start)
      )
      .map((pr: any) => ({
        author: pr.author.username,
        title: pr.title,
        number: pr.id,
        created_at: pr.created_on,
        // TODO: the comments field knows merged_at precisely -> so use that
        merged_at: pr.state === "MERGED" ? pr.updated_on : null,
        closed_at:
          pr.state === "MERGED" || pr.state === "DECLINED"
            ? pr.updated_on
            : null,
        updated_at: pr.updated_on,
        state: pr.state,
        url: pr.links.html.href
      }));

    const result: IPullRequest[] = filteredPulls.map(pr => ({
      ...pr,
      commits: this.getCommitsFromActivity(pr.number, prActivity),
      comments: this.getCommentsFromActivity(pr.number, prActivity)
    }));

    return {
      repo,
      pulls: result
    };
  };

  private getWeekValues = (numWeeks, commits) => {
    const indexNumbers = Array.from(Array(numWeeks).keys());
    return indexNumbers.map(index => {
      const start = moment(this.period.current.start).subtract(index, "weeks");
      const end = moment(start).add(1, "weeks");

      return {
        week: start.unix(),
        value: commits.filter(
          c => moment(c.date) > start && moment(c.date) < end
        ).length
      };
    });
  };

  async repoCommits(repo: string, minDateValue: moment.Moment) {
    // Returns all commits in the repo, all branches
    // https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/commits
    const values = await this.getAllTillDate(
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
    );

    let authorWiseCommits = {};
    values.forEach(commit => {
      const { date } = commit;
      const isInDuration = this.isInDuration(date, minDateValue);
      const { user, raw } = commit.author;
      // This user might not have a linked bitbucket account
      // eg, raw is `Tarun Gupta <tarungupta@Taruns-MacBook-Pro.local>`
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
  }

  commits = async (repo: string): Promise<ICommitsAPIResult> => {
    const NUM_WEEKS = 5;
    const minDateValue = moment(this.period.current.start).subtract(
      NUM_WEEKS - 1,
      "weeks"
    );
    const response = await this.repoCommits(repo, minDateValue);
    const authors = Object.keys(response);
    const stats: IRepoStats[] = authors.map(author => {
      const commits = response[author];
      return {
        author,
        commits: this.getWeekValues(NUM_WEEKS, commits)
      };
    });

    let commits: ICommit[] = [];
    const minDate = moment(this.period.previous.start);
    authors.forEach(author => {
      const authorCommits: ICommit[] = response[author].map(commit => ({
        author,
        date: commit.date,
        sha: commit.hash,
        message: commit.message
      }));
      commits = [
        ...commits,
        ...authorCommits.filter(({ date }) => this.isInDuration(date, minDate))
      ];
    });

    return {
      repo,
      is_pending: false,
      stats,
      commits
    };
  };
}
