import React from "react";
import { Sparkline } from "../Charts";

export const Member = ({ login, avatar }) => {
  return (
    <span>
      <img src={avatar} style={{ width: 20 }} alt={login} />
      <span className="m-2">{login}</span>
    </span>
  );
};

export const Value = ({ previous, next, all, transformer }) => {
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
      {all ? <Sparkline data={all} /> : null}
    </div>
  );
};

const getStatsData = (period, repos, key, authorFilter) => {
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
      previous: values.reduce((s, v) => {
        const f = !!v ? v.filter(value => value.week === previousTs) : [];
        return f.length ? s + f[0].value : s;
      }, 0),
      next: values.reduce((s, v) => {
        const f = !!v ? v.filter(value => value.week === nextTs) : [];
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
    previous: repoValues.reduce((s, v) => s + v.previous, 0),
    next: repoValues.reduce((s, v) => s + v.next, 0),
    all
  };
};

export const getCommits = (period, repos, authorFilter) => {
  return getStatsData(period, repos, "commits", authorFilter);
};

export const getLinesChanged = (period, repos, authorFilter) => {
  const added = getStatsData(period, repos, "lines_added", authorFilter);
  const deleted = getStatsData(period, repos, "lines_deleted", authorFilter);

  return {
    previous: added.previous + deleted.previous,
    next: added.next + deleted.next
  };
};

const getPRsData = (period, repos, key, authorFilter) => {
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
      previous: prs.reduce((s, v) => s + v.previous, 0),
      next: prs.reduce((s, v) => s + v.next, 0)
    };
  });

  return {
    previous: repoPRs.reduce((s, v) => s + v.previous, 0),
    next: repoPRs.reduce((s, v) => s + v.next, 0)
  };
};

export const getPRsMerged = (period, repos, authorFilter) => {
  return getPRsData(period, repos, "prs_merged", authorFilter);
};

export const getPRsOpened = (period, repos, authorFilter) => {
  return getPRsData(period, repos, "prs_opened", authorFilter);
};

function median(values) {
  values.sort(function(a, b) {
    return a - b;
  });
  var half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  else return (values[half - 1] + values[half]) / 2.0;
}

export const getPRsTime = (period, repos, authorFilter) => {
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
      previous: prs.reduce((s, v) => [...s, ...v.previous], []),
      next: prs.reduce((s, v) => [...s, ...v.next], [])
    };
  });

  return {
    previous: median(repoPRs.reduce((s, v) => [...s, ...v.previous], [])),
    next: median(repoPRs.reduce((s, v) => [...s, ...v.next], []))
  };
};
