import { median } from "d3";
import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { diffInSeconds, isInWeek } from "../../../utils/date";
import { PRChartContainer } from "../../Charts/pulls";
import { Filters } from "../common/filters";
import { getPRsMerged, getPRsMergeTime, getPRsOpened } from "../utils";
import { PullsRow } from "./row";

interface IContainerProps {
  repos: IRepository[];
  members: IMember[];
  period: IPeriod;
  isLoading: boolean;
  prActivityData: IPullRequestData[];
  chartBounds: { startDate: Date; endDate: Date };
}

interface IContainerState {
  selectedRepo: { value: string; label: string };
  selectedMember: { value: string; label: string };
}

export class PullsContainer extends React.Component<
  IContainerProps,
  IContainerState
> {
  public state = {
    selectedMember: null,
    selectedRepo: null
  };

  public render() {
    const {
      period,
      chartBounds,
      isLoading,
      members,
      repos,
      prActivityData
    } = this.props;
    const { selectedMember, selectedRepo } = this.state;
    const repoItems = repos.map(repo => ({
      label: repo.name,
      value: repo.name
    }));
    const memberItems = members.map(member => ({
      label: member.login,
      value: member.login
    }));

    const filteredRepos = repos.filter(
      repo => !selectedRepo || repo.name === selectedRepo.value
    );
    const filteredPulls = prActivityData
      .filter(data => !selectedRepo || data.repo === selectedRepo.value)
      .map(({ pulls, ...rest }) => ({
        pulls: pulls.filter(
          pull => !selectedMember || pull.author === selectedMember.value
        ),
        ...rest
      }));
    const authorFilter = !selectedMember ? undefined : selectedMember.value;

    const prsOpened = getPRsOpened(period, filteredRepos, authorFilter);
    const prsMerged = getPRsMerged(period, filteredRepos, authorFilter);
    const prsReviewed = getPRsReviewed(period, filteredPulls);
    const medianMergeTimes = getPRsMergeTime(
      period,
      filteredRepos,
      authorFilter
    );
    const medianCommentTimes = getPRsCommentTime(period, filteredPulls);
    const activeReviewer = getActiveReviewer(period, filteredPulls);

    return (
      <BootstrapContainer>
        <Filters
          title={"Pull Requests"}
          repos={repoItems}
          changeRepo={this.changeRepo}
          members={memberItems}
          changeMember={this.changeMember}
        />

        <PullsRow
          prsOpened={prsOpened}
          prsMerged={prsMerged}
          prsReviewed={prsReviewed}
          activeReviewer={activeReviewer}
          medianMergeTimes={medianMergeTimes}
          medianCommentTimes={medianCommentTimes}
          isLoading={isLoading}
        />

        <PRChartContainer {...chartBounds} data={filteredPulls} />
      </BootstrapContainer>
    );
  }

  private changeRepo = repo => {
    this.setState({ selectedRepo: repo });
  };

  private changeMember = member => {
    this.setState({ selectedMember: member });
  };
}

const flattenedPulls = (pulls: IPullRequestData[]) =>
  pulls.reduce(
    (acc: IPullRequest[], current) => [...acc, ...current.pulls],
    []
  );

const getPRsReviewed = (period: IPeriod, pulls: IPullRequestData[]) => {
  const { next: nextDate, previous: previousDate } = period;
  const flattened = flattenedPulls(pulls);

  const pullsWithCommentsInWeek = (inputPulls, weekStart) => {
    return inputPulls.filter(({ comments }) => {
      const commentsInWeek = comments.filter(({ date }) =>
        isInWeek(date, weekStart)
      );
      return commentsInWeek.length > 0;
    });
  };

  return {
    next: pullsWithCommentsInWeek(flattened, nextDate).length,
    previous: pullsWithCommentsInWeek(flattened, previousDate).length
  };
};

const getPRsCommentTime = (period: IPeriod, pulls: IPullRequestData[]) => {
  const { next: nextDate, previous: previousDate } = period;
  const flattened = flattenedPulls(pulls);

  const pullsWithFirstCommentInWeek = (
    inputPulls: IPullRequest[],
    weekStart
  ) => {
    return inputPulls.filter(({ comments }) => {
      if (comments.length > 0) {
        const firstComment = comments[0];
        return isInWeek(firstComment.date, weekStart);
      } else {
        return false;
      }
    });
  };

  const commentTimes = (inputPulls: IPullRequest[]) => {
    return inputPulls.map(({ comments, created_at: openDate }) => {
      const { date: commentDate } = comments[0];
      return diffInSeconds(openDate, commentDate);
    });
  };

  const result = weekStart =>
    median(commentTimes(pullsWithFirstCommentInWeek(flattened, weekStart))) ||
    undefined;

  return {
    next: result(nextDate),
    previous: result(previousDate)
  };
};

const getActiveReviewer = (period: IPeriod, pulls: IPullRequestData[]) => {
  const { next: nextDate, previous: previousDate } = period;
  const flattened = flattenedPulls(pulls);
  const comments: IPullRequestComment[] = flattened.reduce((acc, current) => {
    return [...acc, ...current.comments];
  }, []);

  const commentsInWeek = (input: IPullRequestComment[], weekStart) => {
    return input.filter(({ date }) => isInWeek(date, weekStart));
  };

  const maxAuthor = (input: IPullRequestComment[]): string => {
    const authors = {};
    input.forEach(({ author }) => {
      authors[author] = author in authors ? authors[author] + 1 : 1;
    });
    return Object.keys(authors).reduce(
      (a, b) => (authors[a] > authors[b] ? a : b),
      undefined
    );
  };

  return {
    next: maxAuthor(commentsInWeek(comments, nextDate)),
    previous: maxAuthor(commentsInWeek(comments, previousDate))
  };
};
