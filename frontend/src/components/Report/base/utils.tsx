import {
  ICommitsAPIResult,
  IPeriodRange,
  IPullRequest,
  IPullsAPIResult
} from "gitstats-shared";
import { IChartDataElement } from "src/components/Charts/base/bar";

export const isSelected = (selectedList, value) => {
  return selectedList.length === 0 || selectedList.indexOf(value) >= 0;
};

export const getCommits = (
  allCommits: ICommitsAPIResult[],
  weekUnix: number,
  selectedRepos: string[],
  selectedAuthors: string[]
): number => {
  const repoCommits = allCommits
    .filter(({ is_pending }) => !is_pending)
    .filter(({ repo }) => isSelected(selectedRepos, repo))
    .map(({ stats }) => {
      const authorStats = stats.filter(({ author }) =>
        isSelected(selectedAuthors, author)
      );
      return authorStats.reduce((total, current) => {
        const { commits: values } = current;
        const thisWeek = values.find(({ week }) => week === weekUnix);
        const weekValue = !!thisWeek ? thisWeek.value : 0;
        return total + weekValue;
      }, 0);
    });

  return repoCommits.reduce((total, current) => total + current, 0);
};

export const getCommitsChartData = (
  allCommits: ICommitsAPIResult[],
  selectedRepos: string[],
  selectedAuthors: string[]
): IChartDataElement[] => {
  const weekWiseAggregate = {};

  allCommits
    .filter(({ is_pending }) => !is_pending)
    .filter(({ repo }) => isSelected(selectedRepos, repo))
    .forEach(({ stats }) => {
      const authorStats = stats.filter(({ author }) =>
        isSelected(selectedAuthors, author)
      );
      authorStats.forEach(({ commits }) => {
        commits.forEach(({ week, value }) => {
          weekWiseAggregate[week] =
            week in weekWiseAggregate ? weekWiseAggregate[week] + value : value;
        });
      });
    });

  // sort in ascending order by week
  const sortedWeeks = Object.keys(weekWiseAggregate).sort();
  return sortedWeeks.map(week => ({ week, value: weekWiseAggregate[week] }));
};

const isInRange = (date: string, range: IPeriodRange) => {
  return !!date && range.start <= date && range.end >= date;
};

export const getComments = (
  allPulls: IPullsAPIResult[],
  dateRange: IPeriodRange,
  selectedRepos: string[],
  selectedAuthors: string[]
) => {
  const repoComments = allPulls
    .filter(({ repo }) => isSelected(selectedRepos, repo))
    .map(({ pulls }) => {
      const authorComments = pulls.map(({ comments }) => {
        const filteredComments = comments
          .filter(({ author }) => isSelected(selectedAuthors, author))
          .filter(({ date }) => isInRange(date, dateRange));
        return filteredComments.length;
      });

      return authorComments.reduce((total, current) => total + current, 0);
    });

  return repoComments.reduce((total, current) => total + current, 0);
};

export const getPRsReviewed = (
  allPulls: IPullsAPIResult[],
  dateRange: IPeriodRange,
  selectedRepos: string[],
  selectedAuthors: string[]
) => {
  const pulls: IPullRequest[] = allPulls
    .filter(({ repo }) => isSelected(selectedRepos, repo))
    .reduce((acc, current) => [...acc, ...current.pulls], []);

  const pullsWithCommentsInWeek = (inputPulls, range) => {
    return inputPulls.filter(({ comments }) => {
      const filteredComments = comments.filter(({ author }) =>
        isSelected(selectedAuthors, author)
      );
      const commentsInWeek = filteredComments.filter(({ date }) =>
        isInRange(date, range)
      );
      return commentsInWeek.length > 0;
    });
  };

  return pullsWithCommentsInWeek(pulls, dateRange).length;
};

export const getPRsApproved = (
  allPulls: IPullsAPIResult[],
  dateRange: IPeriodRange,
  selectedRepos: string[],
  selectedAuthors: string[]
) => {
  const pulls: IPullRequest[] = allPulls
    .filter(({ repo }) => isSelected(selectedRepos, repo))
    .reduce((acc, current) => [...acc, ...current.pulls], [])
    .filter(({ author }) => isSelected(selectedAuthors, author));

  const hasApprovedComment = (pull: IPullRequest, range: IPeriodRange) => {
    const { comments } = pull;
    return (
      comments
        .filter(({ date }) => isInRange(date, range))
        .filter(({ type }) => type === "approved").length > 0
    );
  };

  return pulls.filter(pull => hasApprovedComment(pull, dateRange)).length;
};
