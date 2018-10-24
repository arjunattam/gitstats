import { median } from "d3";
import {
  getPRsMerged,
  getPRsOpened,
  IComment,
  IMember,
  IPeriod,
  IPullRequest,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { IPeriodDeprecated } from "../../../types";
import { diffInSeconds, isInWeek } from "../../../utils/date";
import { PRChartContainer } from "../../Charts/pulls";
import { Filters } from "../common/filters";
import { getPRsMergeTime } from "../utils";
import { PullsRow } from "./row";

interface IContainerProps {
  repos: IRepo[];
  members: IMember[];
  period: IPeriod;
  isLoading: boolean;
  pulls: IPullsAPIResult[];
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
      pulls
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

    const deprecatedPeriod: IPeriodDeprecated = {
      next: period.current.start,
      previous: period.previous.start
    };

    const filteredRepos = repos.filter(
      repo => !selectedRepo || repo.name === selectedRepo.value
    );
    const filteredPulls = pulls
      .filter(data => !selectedRepo || data.repo === selectedRepo.value)
      .map(({ pulls, ...rest }) => ({
        pulls: pulls.filter(
          pull => !selectedMember || pull.author === selectedMember.value
        ),
        ...rest
      }));
    const authorFilter = !selectedMember ? undefined : selectedMember.value;

    const prsOpened = getPRsOpened(
      pulls,
      period,
      !!selectedRepo ? selectedRepo.value : undefined,
      !!selectedMember ? selectedMember.value : undefined
    );

    const prsMerged = getPRsMerged(
      pulls,
      period,
      !!selectedRepo ? selectedRepo.value : undefined,
      !!selectedMember ? selectedMember.value : undefined
    );

    const prsReviewed = getPRsReviewed(deprecatedPeriod, filteredPulls);
    const medianMergeTimes = getPRsMergeTime(
      deprecatedPeriod,
      filteredRepos,
      authorFilter
    );
    const medianCommentTimes = getPRsCommentTime(
      deprecatedPeriod,
      filteredPulls
    );
    const activeReviewer = getActiveReviewer(deprecatedPeriod, filteredPulls);

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
          prsOpened={{ next: prsOpened.current, previous: prsOpened.previous }}
          prsMerged={{ next: prsMerged.current, previous: prsMerged.previous }}
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

const flattenedPulls = (pulls: IPullsAPIResult[]) =>
  pulls.reduce(
    (acc: IPullRequest[], current) => [...acc, ...current.pulls],
    []
  );

const getPRsReviewed = (
  period: IPeriodDeprecated,
  pulls: IPullsAPIResult[]
) => {
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

const getPRsCommentTime = (
  period: IPeriodDeprecated,
  pulls: IPullsAPIResult[]
) => {
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

const getActiveReviewer = (
  period: IPeriodDeprecated,
  pulls: IPullsAPIResult[]
) => {
  const { next: nextDate, previous: previousDate } = period;
  const flattened = flattenedPulls(pulls);
  const comments: IComment[] = flattened.reduce((acc, current) => {
    return [...acc, ...current.comments];
  }, []);

  const commentsInWeek = (input: IComment[], weekStart) => {
    return input.filter(({ date }) => isInWeek(date, weekStart));
  };

  const maxAuthor = (input: IComment[]): string => {
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
