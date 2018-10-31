import {
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPeriodRange,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { Col, Row } from "reactstrap";

interface IListValue {
  name: string;
  commits: number;
  comments: number;
}

interface IListProps {
  values: IListValue[];
  onCheck: any;
}

const sumOfValues = (value: IListValue) => {
  return value.comments + value.commits;
};

const Checkbox = ({ name, onCheckChanged }) => {
  return (
    <input
      type="checkbox"
      onChange={event => onCheckChanged(name, event.target.checked)}
    />
  );
};

const SummaryList: React.SFC<IListProps> = ({ values, onCheck }) => {
  const filtered = values
    .filter(value => sumOfValues(value) > 0)
    .sort((a, b) => sumOfValues(b) - sumOfValues(a));
  return (
    <ul>
      {filtered.map(({ name, commits, comments }) => {
        const checkbox = <Checkbox name={name} onCheckChanged={onCheck} />;
        return (
          <li key={name}>
            {checkbox} {name}: {commits}, {comments}
          </li>
        );
      })}
    </ul>
  );
};

const isSelected = (selectedList, value) => {
  return selectedList.length === 0 || selectedList.indexOf(value) >= 0;
};

const getCommits = (
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

const isInRange = (date: string, range: IPeriodRange) => {
  return !!date && range.start <= date && range.end >= date;
};

const getComments = (
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

interface ITableProps {
  repos: IRepo[];
  members: IMember[];
  period: IPeriod;
  commits: ICommitsAPIResult[];
  pulls: IPullsAPIResult[];
}

interface ITableState {
  selectedRepos: string[];
  selectedMembers: string[];
}

export class SummaryTable extends React.Component<ITableProps, ITableState> {
  public state: ITableState = {
    selectedMembers: [],
    selectedRepos: []
  };

  public render() {
    const { period, repos, members, commits, pulls } = this.props;
    const weekUnix = +new Date(period.current.start) / 1000;
    const { selectedRepos, selectedMembers } = this.state;

    const repoValues = repos.map(repo => {
      return {
        comments: getComments(
          pulls,
          period.current,
          [repo.name],
          selectedMembers
        ),
        commits: getCommits(commits, weekUnix, [repo.name], selectedMembers),
        name: repo.name
      };
    });

    const memberValues = members.map(member => {
      return {
        comments: getComments(pulls, period.current, selectedRepos, [
          member.login
        ]),
        commits: getCommits(commits, weekUnix, selectedRepos, [member.login]),
        name: member.login
      };
    });

    return (
      <Row>
        <Col>
          <SummaryList values={repoValues} onCheck={this.onRepoFilterChanged} />
        </Col>
        <Col>
          <SummaryList
            values={memberValues}
            onCheck={this.onMemberFilterChanged}
          />
        </Col>
      </Row>
    );
  }

  private onRepoFilterChanged = (repoName, isChecked) => {
    const { selectedRepos } = this.state;
    if (isChecked) {
      this.setState({
        selectedRepos: [...selectedRepos, repoName]
      });
    } else {
      this.setState({
        selectedRepos: selectedRepos.filter(repo => repo !== repoName)
      });
    }
  };

  private onMemberFilterChanged = (memberLogin, isChecked) => {
    const { selectedMembers } = this.state;
    if (isChecked) {
      this.setState({
        selectedMembers: [...selectedMembers, memberLogin]
      });
    } else {
      this.setState({
        selectedMembers: selectedMembers.filter(
          member => member !== memberLogin
        )
      });
    }
  };
}
