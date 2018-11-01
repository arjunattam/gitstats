import {
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { Col, Row } from "reactstrap";
import { InlineStacked } from "src/components/Charts/base/inline";
import { getComments, getCommits } from "../base/utils";

const ScrollableTable = ({ maxHeight, colgroup, tbody, thead }) => {
  return (
    <div>
      <div>
        <table className="table mb-0">
          <colgroup>{colgroup}</colgroup>
          <thead>{thead}</thead>
        </table>
      </div>
      <div style={{ maxHeight, overflow: "auto" }}>
        <table className="table">
          <colgroup>{colgroup}</colgroup>
          <tbody>{tbody}</tbody>
        </table>
      </div>
    </div>
  );
};

interface IListValue {
  label: string;
  value: string;
  commits: number;
  comments: number;
}

interface IListProps {
  values: IListValue[];
  onCheckChanged: (name: string, isChecked: boolean) => void;
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

const SummaryList: React.SFC<IListProps> = ({ values, onCheckChanged }) => {
  const filtered = values
    .filter(value => sumOfValues(value) > 0)
    .sort((a, b) => sumOfValues(b) - sumOfValues(a));

  let maxValue = 0;
  if (filtered.length > 0) {
    maxValue = sumOfValues(filtered[0]);
  }

  const rows = filtered.map(({ label, value, commits, comments }) => {
    const checkbox = <Checkbox value={value} onCheckChanged={onCheckChanged} />;
    return (
      <tr key={value}>
        <td>{checkbox}</td>
        <td style={{ whiteSpace: "nowrap" }}>{label}</td>
        <td>
          <InlineStacked
            height={25}
            commits={commits}
            comments={comments}
            width={maxValue}
          />
        </td>
      </tr>
    );
  });

  return (
    <ScrollableTable
      maxHeight={400}
      colgroup={
        <colgroup>
          <col span={1} style={{ width: 15 }} />
          <col span={1} style={{ width: "1%" }} />
          <col span={1} style={{}} />
        </colgroup>
      }
      thead={
        <tr className="small">
          <th colSpan={2}>Filter</th>
          <th>&nbsp;</th>
        </tr>
      }
      tbody={rows}
    />
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
      <Row>
        <Col className="col-6">
          <SummaryList
            values={repoValues}
            onCheckChanged={this.onRepoFilterChanged}
          />
        </Col>
        <Col className="col-6">
          <SummaryList
            values={memberValues}
            onCheckChanged={this.onMemberFilterChanged}
          />
        </Col>
      </Row>
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
