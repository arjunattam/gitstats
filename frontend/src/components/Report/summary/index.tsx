import { getPRsMerged, IPullsAPIResult } from "gitstats-shared";
import * as React from "react";
import { IPeriodDeprecated, RepoForReport } from "../../../types";
import { isInWeek } from "../../../utils/date";
import { CommitChartContainer } from "../../Charts/commits";
import { BaseFilteredContainer } from "../base";
import { LighterContainer } from "../common";
import { Filters } from "../common/filters";
import { getCommits } from "../utils";
import { SummaryRow } from "./row";

export class SummaryContainer extends BaseFilteredContainer {
  public render() {
    const {
      repos,
      members,
      period,
      isLoading,
      pulls,
      commits,
      chartBounds
    } = this.props;
    const { filteredRepo, filteredMember } = this.state;
    const selectedRepo = !!filteredRepo ? filteredRepo.value : undefined;
    const selectedMember = !!filteredMember ? filteredMember.value : undefined;
    const repoItems = repos.map(repo => {
      return {
        label: repo.name,
        value: repo.name
      };
    });
    const memberItems = members.map(member => {
      return {
        label: member.login,
        value: member.login
      };
    });

    const deprecatedPeriod: IPeriodDeprecated = {
      next: period.current.start,
      previous: period.previous.start
    };

    const filteredRepos = repos.filter(
      repo => !selectedRepo || repo.name === selectedRepo
    );
    const filteredPulls = pulls.filter(data => {
      return !selectedRepo || data.repo === selectedRepo;
    });

    const commitsValues = getCommits(
      deprecatedPeriod,
      filteredRepos,
      selectedMember
    );

    const prsMerged = getPRsMerged(pulls, period, selectedRepo, selectedMember);
    const prComments = getPRComments(
      deprecatedPeriod,
      filteredPulls,
      selectedMember
    );
    const activeRepos = getActiveRepo(
      deprecatedPeriod,
      filteredRepos,
      selectedMember
    );
    const activeMembers = getActiveMember(
      deprecatedPeriod,
      filteredRepos,
      selectedMember
    );

    return (
      <LighterContainer>
        <Filters
          title={"Activity"}
          repos={repoItems}
          changeRepo={this.changeRepo}
          members={memberItems}
          changeMember={this.changeMember}
        />
        <SummaryRow
          commits={commitsValues}
          prsMerged={{ next: prsMerged.current, previous: prsMerged.previous }}
          prComments={prComments}
          activeRepos={activeRepos}
          activeMembers={activeMembers}
          isLoading={isLoading}
        />
        <CommitChartContainer
          {...chartBounds}
          commitsData={commits}
          prData={pulls}
          selectedMember={selectedMember}
          selectedRepo={selectedRepo}
        />
      </LighterContainer>
    );
  }
}

const getActiveMember = (
  period: IPeriodDeprecated,
  repos: RepoForReport[],
  authorLogin?: string
) => {
  // TODO: only commits is a flawed metric?
  const nextTs = +new Date(period.next) / 1000;
  const previousTs = +new Date(period.previous) / 1000;
  const authorWise = {};

  repos.forEach(({ stats }) => {
    const { is_pending, authors } = stats;

    if (!is_pending) {
      authors
        .filter(author => {
          return !authorLogin || author.login === authorLogin;
        })
        .forEach(({ login, commits }) => {
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

const getActiveRepo = (
  period: IPeriodDeprecated,
  repos: RepoForReport[],
  authorLogin?: string
) => {
  // TODO: only commits is a flawed metric?
  const nextTs = +new Date(period.next) / 1000;
  const previousTs = +new Date(period.previous) / 1000;

  const parsed = repos.map(({ name, stats }) => {
    const { is_pending, authors } = stats;
    let previous = 0;
    let next = 0;

    if (!is_pending) {
      const filteredAuthors = authors.filter(author => {
        return !authorLogin || author.login === authorLogin;
      });

      previous = filteredAuthors.reduce((acc, current) => {
        const { commits } = current;
        const filtered = commits.filter(({ week }) => week === previousTs);
        return filtered ? acc + filtered[0].value : acc;
      }, 0);

      next = filteredAuthors.reduce((acc, current) => {
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
    .filter(d => d.previous)
    .sort((a, b) => b.previous - a.previous)[0];
  const nextRepo = parsed
    .slice()
    .filter(d => d.next)
    .sort((a, b) => b.next - a.next)[0];
  return {
    next: nextRepo ? nextRepo.name : undefined,
    previous: previousRepo ? previousRepo.name : undefined
  };
};

const getPRComments = (
  period: IPeriodDeprecated,
  prData: IPullsAPIResult[],
  authorLogin?: string
) => {
  const isInPrevious = (date: Date) => isInWeek(date, period.previous);
  const isInNext = (date: Date) => isInWeek(date, period.next);

  const repoWise = prData.map(({ pulls }) => {
    let previous = 0;
    let next = 0;

    pulls.forEach(({ comments }) => {
      const filteredComments = comments.filter(
        comment => !authorLogin || authorLogin === comment.author
      );
      const dates = filteredComments.map(({ date }) => new Date(date));
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
