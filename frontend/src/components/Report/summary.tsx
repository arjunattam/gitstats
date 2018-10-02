import * as React from "react";
import { Container, Row } from "reactstrap";
import { isInWeek } from "../../utils/date";
import { TextColWrapper, ValueColWrapper } from "./common";
import { getCommits, getPRsMerged, getPRsOpened } from "./utils";

const getActiveMember = (period: IPeriod, repos: IRepository[]) => {
  // TODO: only commits is a flawed metric?
  const nextTs = +new Date(period.next) / 1000;
  const previousTs = +new Date(period.previous) / 1000;
  const authorWise = {};

  repos.forEach(({ stats }) => {
    const { is_pending, authors } = stats;
    if (!is_pending) {
      authors.forEach(({ login, commits }) => {
        let previous = 0;
        let next = 0;

        const previousFiltered = commits.filter(
          ({ week }) => week === previousTs
        );
        const nextFiltered = commits.filter(({ week }) => week === nextTs);

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
              next: existingNext + next,
              previous: existingPrevious + previous
            };
          } else {
            authorWise[login] = { next, previous };
          }
        }
      });
    }
  });

  return {
    next: Object.keys(authorWise).sort(
      (a, b) => authorWise[b].next - authorWise[a].next
    )[0],
    previous: Object.keys(authorWise).sort(
      (a, b) => authorWise[b].previous - authorWise[a].previous
    )[0]
  };
};

const getActiveRepo = (period: IPeriod, repos: IRepository[]) => {
  // TODO: only commits is a flawed metric?
  const nextTs = +new Date(period.next) / 1000;
  const previousTs = +new Date(period.previous) / 1000;

  const parsed = repos.map(({ name, stats }) => {
    const { is_pending, authors } = stats;
    let previous = 0;
    let next = 0;

    if (!is_pending) {
      previous = authors.reduce((acc, current) => {
        const { commits } = current;
        const filtered = commits.filter(({ week }) => week === previousTs);
        return filtered ? acc + filtered[0].value : acc;
      }, 0);

      next = authors.reduce((acc, current) => {
        const { commits } = current;
        const filtered = commits.filter(({ week }) => week === nextTs);
        return filtered ? acc + filtered[0].value : acc;
      }, 0);
    }

    return {
      name,
      next,
      previous
    };
  });

  const previousRepo = parsed
    .slice()
    .sort((a, b) => b.previous - a.previous)[0];
  const nextRepo = parsed.slice().sort((a, b) => b.next - a.next)[0];
  return {
    next: nextRepo ? nextRepo.name : undefined,
    previous: previousRepo ? previousRepo.name : undefined
  };
};

const getPRComments = (period: IPeriod, prData: IPullRequestData[]) => {
  const isInPrevious = (date: Date) => isInWeek(date, period.previous);
  const isInNext = (date: Date) => isInWeek(date, period.next);

  const repoWise = prData.map(({ pulls }) => {
    let previous = 0;
    let next = 0;

    pulls.forEach(({ comments }) => {
      const dates = comments.map(({ date }) => new Date(date));
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

export const SummaryRow: React.SFC<ISummaryProps> = ({
  period,
  repos,
  prData,
  isLoading
}) => {
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
