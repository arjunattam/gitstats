import {
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { Col, Row } from "reactstrap";
import { getComments, getCommits } from "../base/utils";

interface IListValue {
  label: string;
  value: string;
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

const Checkbox = ({ value, onCheckChanged }) => {
  return (
    <input
      type="checkbox"
      onChange={event => onCheckChanged(value, event.target.checked)}
    />
  );
};

const SummaryList: React.SFC<IListProps> = ({ values, onCheck }) => {
  const filtered = values
    .filter(value => sumOfValues(value) > 0)
    .sort((a, b) => sumOfValues(b) - sumOfValues(a));
  return (
    <ul>
      {filtered.map(({ label, value, commits, comments }) => {
        const checkbox = <Checkbox value={value} onCheckChanged={onCheck} />;
        return (
          <li key={label}>
            {checkbox} {label}: {commits}, {comments}
          </li>
        );
      })}
    </ul>
  );
};

interface ITableProps {
  repos: IRepo[];
  members: IMember[];
  period: IPeriod;
  commits: ICommitsAPIResult[];
  pulls: IPullsAPIResult[];
  selectedRepos: string[];
  selectedMembers: string[];
  onRepoSelected: (repos: string[]) => void;
  onMemberSelected: (members: string[]) => void;
}

const getMemberName = (memberLogin, members: IMember[]) => {
  const member = members.find(({ login }) => login === memberLogin);
  return !!member ? member.name : memberLogin;
};

export class SummaryTable extends React.Component<ITableProps, {}> {
  public render() {
    const { period, repos, members, commits, pulls } = this.props;
    const { selectedRepos, selectedMembers } = this.props;
    const weekUnix = +new Date(period.current.start) / 1000;

    const repoValues = repos.map(repo => {
      return {
        comments: getComments(
          pulls,
          period.current,
          [repo.name],
          selectedMembers
        ),
        commits: getCommits(commits, weekUnix, [repo.name], selectedMembers),
        label: repo.name,
        value: repo.name
      };
    });

    const memberValues = members.map(member => {
      return {
        comments: getComments(pulls, period.current, selectedRepos, [
          member.login
        ]),
        commits: getCommits(commits, weekUnix, selectedRepos, [member.login]),
        label: getMemberName(member.login, members),
        value: member.login
      };
    });

    return (
      <div>
        <h4>Activity summary</h4>
        <Row>
          <Col>
            <SummaryList
              values={repoValues}
              onCheck={this.onRepoFilterChanged}
            />
          </Col>
          <Col>
            <SummaryList
              values={memberValues}
              onCheck={this.onMemberFilterChanged}
            />
          </Col>
        </Row>
      </div>
    );
  }

  private onRepoFilterChanged = (repoName, isChecked) => {
    const { selectedRepos, onRepoSelected } = this.props;
    if (isChecked) {
      onRepoSelected([...selectedRepos, repoName]);
    } else {
      onRepoSelected(selectedRepos.filter(repo => repo !== repoName));
    }
  };

  private onMemberFilterChanged = (memberLogin, isChecked) => {
    const { selectedMembers, onMemberSelected } = this.props;
    if (isChecked) {
      onMemberSelected([...selectedMembers, memberLogin]);
    } else {
      onMemberSelected(
        selectedMembers.filter(member => member !== memberLogin)
      );
    }
  };
}
