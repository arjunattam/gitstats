import { median } from "d3";
import {
  getPRsMerged,
  getPRsMergeTime,
  getPRsOpened,
  IComment,
  IPullRequest,
  IPullsAPIResult
} from "gitstats-shared";
import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { IPeriodDeprecated } from "../../../types";
import { diffInSeconds, isInWeek } from "../../../utils/date";
import { PRChartContainer } from "../../Charts/pulls";
import { BaseFilteredContainer } from "../base";
import { Filters } from "../common/filters";
import { PullsRow } from "./row";

export class PullsContainer extends BaseFilteredContainer {
  public render() {
    const {
      period,
      chartBounds,
      isLoading,
      members,
      repos,
      pulls
    } = this.props;
    const { filteredMember, filteredRepo } = this.state;
    const selectedRepo = !!filteredRepo ? filteredRepo.value : undefined;
    const selectedMember = !!filteredMember ? filteredMember.value : undefined;
    const repoItems = repos.map(repo => {
      const metric = getPRsOpened(pulls, period, repo.name, selectedMember);
      return {
        label: `${repo.name} (${metric.current})`,
        value: repo.name
      };
    });
    const memberItems = members.map(member => {
      const metric = getPRsOpened(pulls, period, selectedRepo, member.login);
      return {
        label: `${member.login} (${metric.current})`,
        value: member.login
      };
    });

    const deprecatedPeriod: IPeriodDeprecated = {
      next: period.current.start,
      previous: period.previous.start
    };

    const filteredPulls = pulls
      .filter(data => !selectedRepo || data.repo === selectedRepo)
      .map(({ pulls, ...rest }) => ({
        pulls: pulls.filter(
          pull => !selectedMember || pull.author === selectedMember
        ),
        ...rest
      }));
    const prsOpened = getPRsOpened(pulls, period, selectedRepo, selectedMember);
    const prsMerged = getPRsMerged(pulls, period, selectedRepo, selectedMember);
    const prsReviewed = getPRsReviewed(deprecatedPeriod, filteredPulls);
    const mergeTimes = getPRsMergeTime(
      pulls,
      period,
      selectedRepo,
      selectedMember
    );
    const medianCommentTimes = getPRsCommentTime(
      deprecatedPeriod,
      filteredPulls
    );
    const activeReviewer = getActiveReviewer(deprecatedPeriod, filteredPulls);

    let chartData: IPullRequest[] = [];

    if (!!selectedRepo || !!selectedMember) {
      // At least one filter must be applied for the PR chart to show data
      chartData = pulls
        .filter(({ repo }) => !selectedRepo || repo === selectedRepo)
        .reduce((acc, curr) => [...acc, ...curr.pulls], [])
        .filter(({ author }) => !selectedMember || author === selectedMember);
    }

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
          medianMergeTimes={{
            next: mergeTimes.current,
            previous: mergeTimes.previous
          }}
          medianCommentTimes={medianCommentTimes}
          isLoading={isLoading}
        />
        <PRChartContainer {...chartBounds} data={chartData} />
      </BootstrapContainer>
    );
  }
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
