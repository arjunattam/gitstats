import { median } from "d3";
import * as React from "react";

export const getChange = (previous, next) => {
  let isInfinity = false;
  let direction: "up" | "down";
  let value = 0; // percentage change

  if (previous === 0) {
    if (next !== 0) {
      isInfinity = true;
      direction = "up";
    } else {
      value = 0;
    }
  } else {
    value = Math.round(((1.0 * next) / previous - 1) * 100);
    direction = value > 0 ? "up" : "down";
    value = Math.abs(value);
    if (value > 1000) {
      isInfinity = true;
    }
  }

  return {
    direction,
    isInfinity,
    value
  };
};

export const Value = ({ previous, next, transformer }) => {
  let change;
  let classModifier = `badge-secondary`;

  if (previous === 0) {
    if (next !== 0) {
      change = `↑ ∞`;
      classModifier = `badge-light`;
    }
  } else {
    const numChange = Math.round(((1.0 * next) / previous - 1) * 100);
    if (numChange > 20) {
      classModifier = `badge-light`;
    } else if (numChange < -20) {
      classModifier = `badge-dark`;
    }
    if (numChange > 1000) {
      change = `↑ ∞`;
    } else {
      const arrow = numChange > 0 ? "↑" : "↓";
      change = `${arrow} ${Math.abs(numChange)}%`;
    }
  }

  return (
    <div>
      {transformer ? transformer(next) : next}
      <small>
        <span className={`m-2 badge ${classModifier}`}>{change}</span>
      </small>
    </div>
  );
};

const getStatsData = (period, repos, key, authorFilter?) => {
  const { next, previous } = period;
  const nextTs = +new Date(next) / 1000;
  const previousTs = +new Date(previous) / 1000;
  const repoValues = repos.map(repo => {
    const { authors } = repo.stats;
    let values = [];
    if (authors) {
      const filtered = authors.filter(
        author => (authorFilter ? author.login === authorFilter : true)
      );
      values = filtered.map(author => author[key]);
    }

    return {
      next: values.reduce((s, v) => {
        const f = !!v ? v.filter(value => value.week === nextTs) : [];
        return f.length ? s + f[0].value : s;
      }, 0),
      previous: values.reduce((s, v) => {
        const f = !!v ? v.filter(value => value.week === previousTs) : [];
        return f.length ? s + f[0].value : s;
      }, 0),
      values
    };
  });

  const weekWise = repoValues.reduce((s, v) => {
    const { values } = v;
    values.forEach(valueArray => {
      valueArray.forEach(({ week, value }) => {
        s[week] = week in s ? s[week] + value : value;
      });
    });
    return s;
  }, {});

  let all = [];
  Object.keys(weekWise).forEach(
    key => (all = [...all, { week: key, value: weekWise[key] }])
  );

  return {
    chartData: all,
    next: repoValues.reduce((s, v) => s + v.next, 0),
    previous: repoValues.reduce((s, v) => s + v.previous, 0)
  };
};

export const getCommits = (period, repos, authorFilter?) => {
  return getStatsData(period, repos, "commits", authorFilter);
};

export const getLinesChanged = (period, repos, authorFilter?) => {
  const added = getStatsData(period, repos, "lines_added", authorFilter);
  const deleted = getStatsData(period, repos, "lines_deleted", authorFilter);
  return {
    next: added.next + deleted.next,
    previous: added.previous + deleted.previous
  };
};

const getPRsData = (period, repos, key, authorFilter?) => {
  const repoPRs = repos.map(repo => {
    const data = repo.prs;
    let prs = [];
    if (data) {
      const filtered = data.filter(
        author => (authorFilter ? author.author === authorFilter : true)
      );
      prs = filtered.map(author => author[key]);
    }

    return {
      next: prs.reduce((s, v) => s + v.next, 0),
      previous: prs.reduce((s, v) => s + v.previous, 0)
    };
  });

  return {
    next: repoPRs.reduce((s, v) => s + v.next, 0),
    previous: repoPRs.reduce((s, v) => s + v.previous, 0)
  };
};

export const getPRsMerged = (period, repos, authorFilter?) => {
  return getPRsData(period, repos, "prs_merged", authorFilter);
};

export const getPRsOpened = (period, repos, authorFilter?) => {
  return getPRsData(period, repos, "prs_opened", authorFilter);
};

export const getPRsMergeTime = (period, repos, authorFilter?) => {
  // TODO: why is period not used?
  const repoPRs = repos.map(repo => {
    const data = repo.prs;
    let prs = [];
    if (data) {
      const filtered = data.filter(
        author => (authorFilter ? author.author === authorFilter : true)
      );
      prs = filtered.map(author => author.time_to_merge);
    }
    return {
      next: prs.reduce((s, v) => [...s, ...v.next], []),
      previous: prs.reduce((s, v) => [...s, ...v.previous], [])
    };
  });
  return {
    next: median(repoPRs.reduce((s, v) => [...s, ...v.next], [])),
    previous: median(repoPRs.reduce((s, v) => [...s, ...v.previous], []))
  };
};
