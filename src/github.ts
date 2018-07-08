import { getComparativeResponse } from "./utils";
import * as moment from "moment";
const rp = require("request-promise-native");
const parseLink = require("parse-link-header");

const options = {
  baseUrl: "https://api.github.com/",
  qs: {
    per_page: 100
  },
  headers: {
    "User-Agent": "gitstats.report"
  },
  resolveWithFullResponse: true,
  json: true
};

export default class GithubService {
  uri: string;

  constructor(private owner: string, private repo: string) {
    this.uri = `repos/${this.owner}/${this.repo}`;
  }

  get({ path, headers, qs }) {
    return rp({
      ...options,
      uri: `${this.uri}/${path}`,
      headers: {
        ...options.headers,
        ...headers
      },
      qs: {
        ...options.qs,
        ...qs
      }
    });
  }

  getAllPages(aggregate, params) {
    return this.get(params).then(response => {
      const { body, headers } = response;
      const { link } = headers;
      const next = link ? parseLink(link).next : {};
      // TODO(arjun): filter function on the body should be abstracted out
      const newAggregate = [...aggregate, ...body.filter(r => !r.pull_request)];

      if (next && next.page) {
        return this.getAllPages(newAggregate, {
          ...params,
          qs: { ...params.qs, page: next.page }
        });
      } else {
        return newAggregate;
      }
    });
  }

  // This method parses API responses in reverse order
  // till the date key value is below required
  buildResponse(aggregatedBody, key, params) {
    const lastValue = moment().subtract(2, "weeks");
    return this.get(params).then(response => {
      const { body, headers } = response;
      const { link } = headers;
      const { prev } = parseLink(link);
      let hasReachedLimit = false;
      body.forEach(r => {
        if (moment(r[key]) < lastValue) {
          hasReachedLimit = true; // We have reached the end.
        } else {
          aggregatedBody.push(r);
        }
      });

      if (!hasReachedLimit && prev && prev.page) {
        return this.buildResponse(aggregatedBody, key, {
          ...params,
          qs: { ...params.qs, page: prev.page }
        });
      } else {
        return aggregatedBody;
      }
    });
  }

  issues() {
    // TODO(arjun): this can be used for both issues and PRs, which means we cannot
    // differentiate between a closed PR and a merged PR
    const params = {
      path: "issues",
      headers: {},
      qs: {
        state: "all",
        since: moment()
          .subtract(2, "weeks")
          .toISOString()
      }
    };
    return this.getAllPages([], params).then(response => {
      return {
        name: "issues_created",
        values: getComparativeResponse(response, "created_at")
      };
    });
  }

  stargazers() {
    const params = {
      path: "stargazers",
      headers: { Accept: "application/vnd.github.v3.star+json" },
      qs: {}
    };
    return this.get(params)
      .then(response => {
        const { link } = response.headers;
        const parsedLink = link ? parseLink(link) : {};

        if (parsedLink && parsedLink.last) {
          const { page } = parsedLink.last;
          const bodyPromise = this.buildResponse([], "starred_at", {
            ...params,
            qs: { ...params.qs, page }
          });
          return bodyPromise;
        } else {
          // There is just one page, so we will return that
          return response.body;
        }
      })
      .then(response => {
        return {
          name: "stargazers",
          values: getComparativeResponse(response, "starred_at")
        };
      });
  }
}
