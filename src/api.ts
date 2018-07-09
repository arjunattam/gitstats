import * as moment from "moment";
const rp = require("request-promise-native");
const parseLink = require("parse-link-header");

export default class APICaller {
  baseUrl: string;
  periodPrev: moment.Moment;
  periodNext: moment.Moment;

  constructor(private token: string, public owner: string) {
    this.baseUrl = "https://api.github.com/";

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

  get({ path, headers, qs }) {
    return rp({
      baseUrl: this.baseUrl,
      uri: `${path}`,
      headers: {
        "User-Agent": "gitstats.report",
        Authorization: `token ${this.token}`,
        ...headers
      },
      qs: {
        per_page: 100,
        ...qs
      },
      json: true,
      resolveWithFullResponse: true
    });
  }

  getAllPages(aggregate, params) {
    return this.get(params).then(response => {
      const { body, headers } = response;
      const { link } = headers;
      const next = link ? parseLink(link).next : {};
      const newAggregate = [...aggregate, ...body];

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

  getAllForDesc(responseSoFar, params, key) {
    // For response sorted in descending order by key
    // Returns data till we reach key < timeLimit
    return this.get(params).then(response => {
      const { body, headers } = response;
      const filtered = body.filter(item => moment(item[key]) > this.periodPrev);
      const newAggregate = [...responseSoFar, ...filtered];

      if (filtered.length === body.length) {
        // All items met criteria, we need to get the next page
        const { link } = headers;
        const parsedLink = link ? parseLink(link) : {};

        if (parsedLink && parsedLink.next) {
          // Get the next page
          const { page } = parsedLink.next;
          return this.getAllForDesc(
            newAggregate,
            {
              ...params,
              qs: { ...params.qs, page }
            },
            key
          );
        }
      }

      return newAggregate;
    });
  }

  getAllForAsc(params, key) {
    // Useful for API responses that are sorted by `key` but in
    // ascending order. We parse the APIs in reverse from last page
    return this.get(params).then(response => {
      const { link } = response.headers;
      const parsedLink = link ? parseLink(link) : {};

      if (parsedLink && parsedLink.last) {
        const { page } = parsedLink.last;
        const bodyPromise = this.buildResponse([], key, {
          ...params,
          qs: { ...params.qs, page }
        });
        return bodyPromise;
      } else {
        return response.body; // There is just one page
      }
    });
  }

  buildResponse(aggregatedBody, key, params) {
    // This method parses API responses in reverse order
    // till the date key value is below required
    return this.get(params).then(response => {
      const { body, headers } = response;
      const { link } = headers;
      const { prev } = parseLink(link);
      let hasReachedLimit = false;
      body.forEach(r => {
        if (moment(r[key]) < this.periodPrev) {
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
}
