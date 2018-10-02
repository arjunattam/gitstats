import React from "react";
import { Container, Col, Row } from "reactstrap";
import { getChange, getCommits, getPRsMerged, getPRsOpened } from "./utils";
import { BarChart } from "../Charts/base/bar";
import { isInWeek } from "../../utils/date";

const ValueCol = ({ title, value, summaryText }) => {
  return (
    <Col className="border py-3">
      <div className="text-muted small text-uppercase">{title}</div>
      <div className="h3 my-1">{value}</div>
      <div>{summaryText}</div>
    </Col>
  );
};

const ValueColWithChart = ({ title, value, summaryText, chartData }) => {
  return (
    <Col className="border py-3">
      <div className="text-muted small text-uppercase">{title}</div>
      <div className="d-flex justify-content-between">
        <div>
          <div className="h3 my-1">{value}</div>
          <div className="text-nowrap">{summaryText}</div>
        </div>
        <BarChart data={chartData} />
      </div>
    </Col>
  );
};

const ValueColWrapper = ({ title, previous, next, chartData }) => {
  const { isInfinity, value, direction } = getChange(previous, next);
  let summaryText, miniSummary;

  if (isInfinity) {
    summaryText = "Big jump over last week";
    miniSummary = "↑ ∞";
  } else {
    if (direction === "up") {
      summaryText = `↑ ${value}% over last week`;
      miniSummary = `↑ ${value}%`;
    } else if (direction === "down") {
      summaryText = `↓ ${value}% from last week`;
      miniSummary = `↓ ${value}%`;
    }
  }

  if (!!chartData) {
    return (
      <ValueColWithChart
        title={title}
        value={next}
        summaryText={miniSummary}
        chartData={chartData}
      />
    );
  } else {
    return <ValueCol title={title} value={next} summaryText={summaryText} />;
  }
};

const TextColWrapper = ({ title, previous, next }) => {
  let summaryText;

  if (!!next && !!previous) {
    if (previous === next) {
      summaryText = "Same as last week";
    } else {
      summaryText = `Last week it was ${previous}`;
    }
  }

  return <ValueCol title={title} value={next} summaryText={summaryText} />;
};

const getActiveMember = (period, repos) => {
  // TODO: only commits is a flawed metric?
  const { next, previous } = period;
  const nextTs = +new Date(next) / 1000;
  const previousTs = +new Date(previous) / 1000;
  let authorWise = {};

  repos.forEach(({ stats }) => {
    const { is_pending, authors } = stats;

    if (!is_pending) {
      authors.forEach(({ login, commits }) => {
        let previous,
          next = 0;
        const previousFiltered = commits.filter(
          ({ week, value }) => week === previousTs
        );
        const nextFiltered = commits.filter(
          ({ week, value }) => week === nextTs
        );

        if (previousFiltered) {
          previous = previousFiltered[0].value;
        }

        if (nextFiltered) {
          next = nextFiltered[0].value;
        }

        if (next > 0 || previous > 0) {
          if (login in authorWise) {
            const {
              previous: existingPrevious,
              next: existingNext
            } = authorWise[login];
            authorWise[login] = {
              previous: existingPrevious + previous,
              next: existingNext + next
            };
          } else {
            authorWise[login] = { next, previous };
          }
        }
      });
    }
  });

  if (Object.keys(authorWise).length > 0) {
    return {
      next: Object.keys(authorWise).sort(
        (a, b) => authorWise[b].next - authorWise[a].next
      )[0],
      previous: Object.keys(authorWise).sort(
        (a, b) => authorWise[b].previos - authorWise[a].previous
      )[0]
    };
  }
};

const getActiveRepo = (period, repos) => {
  // TODO: only commits is a flawed metric?
  const { next, previous } = period;
  const nextTs = +new Date(next) / 1000;
  const previousTs = +new Date(previous) / 1000;

  const parsed = repos.map(({ name, stats }) => {
    const { is_pending, authors } = stats;
    let previous = 0,
      next = 0;

    if (!is_pending) {
      previous = authors.reduce((acc, current) => {
        const { commits } = current;
        const filtered = commits.filter(
          ({ week, value }) => week === previousTs
        );

        if (filtered) {
          return acc + filtered[0].value;
        } else {
          return acc;
        }
      }, 0);

      next = authors.reduce((acc, current) => {
        const { commits } = current;
        const filtered = commits.filter(({ week, value }) => week === nextTs);

        if (filtered) {
          return acc + filtered[0].value;
        } else {
          return acc;
        }
      }, 0);
    }

    return {
      name,
      previous,
      next
    };
  });

  if (parsed.length > 0) {
    const previousRepo = parsed
      .slice()
      .sort((a, b) => b.previous - a.previous)[0];
    const nextRepo = parsed.slice().sort((a, b) => b.next - a.next)[0];
    return { next: nextRepo.name, previous: previousRepo.name };
  }
};

const getPRComments = (period, prData) => {
  const isInPrevious = date => {
    const { previous } = period;
    return isInWeek(date, previous);
  };

  const isInNext = date => {
    const { next } = period;
    return isInWeek(date, next);
  };

  const repoWise = prData.map(({ repo, pulls }) => {
    let previous = 0,
      next = 0;

    pulls.forEach(({ comments }) => {
      const dates = comments.map(({ author, date }) => {
        return new Date(date);
      });
      const previousValue = dates.filter(date => isInPrevious(date)).length;
      const nextValue = dates.filter(date => isInNext(date)).length;

      previous += previousValue;
      next += nextValue;
    });

    return { next, previous };
  });

  return {
    next: repoWise.reduce((acc, current) => acc + current.next, 0),
    previous: repoWise.reduce((acc, current) => acc + current.previous, 0)
  };
};

export const SummaryRow = ({ period, repos, prData, isLoading }) => {
  const commits = getCommits(period, repos);
  const { all: chartData } = commits;
  const prsOpened = getPRsOpened(period, repos);
  const prsMerged = getPRsMerged(period, repos);
  const prComments = getPRComments(period, prData);
  const activeRepos = getActiveRepo(period, repos);
  const activeMembers = getActiveMember(period, repos);

  return (
    <Container className="my-5">
      <Row>
        <ValueColWrapper {...commits} title={"Commits"} chartData={chartData} />
        <ValueColWrapper {...prsOpened} title={"PRs opened"} />
        <ValueColWrapper {...prsMerged} title={"PRs merged"} />
        <ValueColWrapper {...prComments} title={"PR Comments"} />
      </Row>
      <Row>
        <TextColWrapper {...activeRepos} title={"Most Active Repo"} />
        <TextColWrapper {...activeMembers} title={"Most Active Member"} />
      </Row>
    </Container>
  );
};
