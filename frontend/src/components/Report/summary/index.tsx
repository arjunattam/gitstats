import * as React from "react";
import { isInWeek } from "../../../utils/date";
import { CommitChartContainer } from "../../Charts/commits";
import { LighterContainer } from "../common";
import { ALL_MEMBERS, ALL_REPOS, Filters } from "../common/filters";
import { getCommits, getPRsMerged, getPRsOpened } from "../utils";
import { SummaryRow } from "./row";

interface ISummaryContainerProps {
  repos: IRepository[];
  members: IMember[];
  period: IPeriod;
  isLoading: boolean;
  prActivityData: IPullRequestData[];
  commitsData: ICommits[];
  chartBounds: { startDate: Date; endDate: Date };
}

interface ISummaryContainerState {
  selectedRepo: string;
  selectedMember: string;
}

export class SummaryContainer extends React.Component<
  ISummaryContainerProps,
  ISummaryContainerState
> {
  public state = {
    selectedMember: ALL_MEMBERS,
    selectedRepo: ALL_REPOS
  };

  public render() {
    const {
      repos,
      members,
      period,
      isLoading,
      prActivityData,
      commitsData,
      chartBounds
    } = this.props;
    const { selectedRepo, selectedMember } = this.state;
    const repoItems = repos.map(repo => ({
      text: repo.name,
      value: undefined
    }));
    const memberItems = members.map(member => ({
      text: member.login,
      value: undefined
    }));

    const filteredRepos = repos.filter(
      repo => (selectedRepo === ALL_REPOS ? true : repo.name === selectedRepo)
    );
    const authorFilter =
      selectedMember === ALL_MEMBERS ? undefined : selectedMember;
    const commits = getCommits(period, filteredRepos, authorFilter);
    const prsOpened = getPRsOpened(period, filteredRepos, authorFilter);
    const prsMerged = getPRsMerged(period, filteredRepos, authorFilter);
    const prComments = getPRComments(period, prActivityData);
    const activeRepos = getActiveRepo(period, filteredRepos);
    const activeMembers = getActiveMember(period, filteredRepos);

    return (
      <LighterContainer>
        <Filters
          title={"Activity"}
          repos={repoItems}
          selectedRepo={selectedRepo}
          changeRepo={this.changeRepo}
          showAllRepos={this.showAllRepos}
          members={memberItems}
          selectedMember={selectedMember}
          changeMember={this.changeMember}
          showAllMembers={this.showAllMembers}
        />
        <SummaryRow
          commits={commits}
          prsOpened={prsOpened}
          prsMerged={prsMerged}
          prComments={prComments}
          activeRepos={activeRepos}
          activeMembers={activeMembers}
          isLoading={isLoading}
        />
        <CommitChartContainer
          {...chartBounds}
          commitsData={commitsData}
          prData={prActivityData}
          selectedMember={selectedMember}
          selectedRepo={selectedRepo}
        />
      </LighterContainer>
    );
  }

  private changeRepo = repo => {
    this.setState({ selectedRepo: repo });
  };

  private showAllRepos = () => {
    this.setState({ selectedRepo: ALL_REPOS });
  };

  private changeMember = member => {
    this.setState({ selectedMember: member });
  };

  private showAllMembers = () => {
    this.setState({ selectedMember: ALL_MEMBERS });
  };
}

const getActiveMember = (period: IPeriod, repos: IRepository[]) => {
  // TODO: only commits is a flawed metric?
  // TODO: add author filter
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
  // TODO: add author filter
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
  // TODO: add author filter
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
