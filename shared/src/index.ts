import moment from "moment";
import { median } from "./utils";

export interface ITeam {
  login: string;
  name: string;
  avatar: string;
  service: string;
}

export interface IRepo {
  name: string;
  url: string;
  description: string;
  is_private: boolean;
  is_fork: boolean;
  stargazers_count: number;
  updated_at: string;
}

export interface IMember {
  login: string;
  name: string;
  avatar: string;
}

export interface ICommit {
  author: string;
  date: string;
  message: string;
  sha: string;
}

export interface IComment {
  author: string;
  date: string;
}

export interface IPullRequest {
  author: string;
  title: string;
  number: number;
  created_at: string;
  merged_at: string;
  closed_at: string;
  updated_at: string;
  state: string;
  url: string;
  comments: IComment[];
  commits: ICommit[];
}

export interface IPullsAPIResult {
  repo: string;
  pulls: IPullRequest[];
}

export interface IWeekValue {
  week: number;
  value: number;
}

export interface IRepoStats {
  author: string;
  commits: IWeekValue[];
}

export interface ICommitsAPIResult {
  repo: string;
  is_pending: boolean;
  stats: IRepoStats[];
  commits: ICommit[];
}

export interface ITeamInfoAPIResult extends ITeam {
  repos: IRepo[];
  members: IMember[];
}

export interface IPeriodRange {
  start: string; // start time in ISO format
  end: string; // end time in ISO format
}

export interface IPeriod {
  current: IPeriodRange;
  previous: IPeriodRange;
}

export const getPeriodLastWeek = (): IPeriod => {
  const now = moment.utc();
  const startCurrent = now.startOf("week").subtract(1, "week");
  const startPrevious = startCurrent.clone().subtract(1, "week");
  return {
    current: {
      start: startCurrent.clone().toISOString(),
      end: startCurrent
        .clone()
        .endOf("week")
        .toISOString()
    },
    previous: {
      start: startPrevious.clone().toISOString(),
      end: startPrevious
        .clone()
        .endOf("week")
        .toISOString()
    }
  };
};

export const getPeriodLastSevenDays = (): IPeriod => {
  const now = moment.utc();
  const startCurrent = now.startOf("day").subtract(1, "week");
  const startPrevious = startCurrent.clone().subtract(1, "week");
  return {
    current: {
      start: startCurrent.clone().toISOString(),
      end: startCurrent
        .clone()
        .add(1, "week")
        .subtract(1, "millisecond")
        .toISOString()
    },
    previous: {
      start: startPrevious.clone().toISOString(),
      end: startPrevious
        .clone()
        .add(1, "week")
        .subtract(1, "millisecond")
        .toISOString()
    }
  };
};

export const getDateLabels = (input: string) => {
  const parsed = moment(input).utc();
  return {
    date: parsed.format("MMM D"),
    day: parsed.format("dddd")
  };
};

const filterForPropertyInRange = (
  pulls: any[],
  range: IPeriodRange,
  property: string
) => {
  return pulls.filter((pull: any) => {
    const value: string = pull[property];
    return !!value && range.start <= value && range.end >= value;
  });
};

const getPRValues = (
  pulls: IPullRequest[],
  property: string,
  period: IPeriod
) => {
  const { current, previous } = period;
  const currentPulls = filterForPropertyInRange(pulls, current, property);
  const previousPulls = filterForPropertyInRange(pulls, previous, property);
  return {
    current: currentPulls.length,
    previous: previousPulls.length
  };
};

const getFilteredPulls = (
  pulls: IPullsAPIResult[],
  selectedRepo: string,
  selectedAuthor: string
) => {
  const filteredByRepo = pulls.filter(
    ({ repo }) => !selectedRepo || repo === selectedRepo
  );
  const flattened = filteredByRepo.reduce((acc: IPullRequest[], curr) => {
    return [...acc, ...curr.pulls];
  }, []);
  const filteredByAuthor = flattened.filter(({ author }) => {
    return !selectedAuthor || selectedAuthor === author;
  });
  return filteredByAuthor;
};

export const getPRsOpened = (
  pulls: IPullsAPIResult[],
  period: IPeriod,
  selectedRepo: string,
  selectedAuthor: string
) => {
  const filtered = getFilteredPulls(pulls, selectedRepo, selectedAuthor);
  return getPRValues(filtered, "created_at", period);
};

export const getPRsMerged = (
  pulls: IPullsAPIResult[],
  period: IPeriod,
  selectedRepo: string,
  selectedAuthor: string
) => {
  const filtered = getFilteredPulls(pulls, selectedRepo, selectedAuthor);
  return getPRValues(filtered, "merged_at", period);
};

const getPRDurations = (
  pulls: IPullRequest[],
  endProperty: string,
  startProperty: string
) => {
  return pulls.map((pull: any) => {
    const endTime = moment(pull[endProperty]);
    const startTime = moment(pull[startProperty]);
    return endTime.diff(startTime, "seconds");
  });
};

export const getPRsMergeTime = (
  allPulls: IPullsAPIResult[],
  period: IPeriod,
  selectedRepo: string,
  selectedAuthor: string
) => {
  const pulls = getFilteredPulls(allPulls, selectedRepo, selectedAuthor);
  const { current, previous } = period;
  const currentPulls = filterForPropertyInRange(pulls, current, "merged_at");
  const previousPulls = filterForPropertyInRange(pulls, previous, "merged_at");
  return {
    current: median(getPRDurations(currentPulls, "merged_at", "created_at")),
    previous: median(getPRDurations(previousPulls, "merged_at", "created_at"))
  };
};

export const getPRsCommentTime = (
  allPulls: IPullsAPIResult[],
  period: IPeriod,
  selectedRepo: string,
  selectedAuthor: string
) => {
  const pulls = getFilteredPulls(allPulls, selectedRepo, selectedAuthor).map(
    pull => {
      const { comments } = pull;
      const comment_at = comments.length > 0 ? comments[0].date : null;
      return { ...pull, comment_at };
    }
  );
  const { current, previous } = period;
  const currentPulls = filterForPropertyInRange(pulls, current, "comment_at");
  const previousPulls = filterForPropertyInRange(pulls, previous, "comment_at");
  return {
    current: median(getPRDurations(currentPulls, "comment_at", "created_at")),
    previous: median(getPRDurations(previousPulls, "comment_at", "created_at"))
  };
};
