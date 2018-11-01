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
import { TitleLoader } from "../loaders";

const ScrollableTable = ({ maxHeight, colgroup, tbody, thead }) => {
  return (
    <div>
      <div>
        <table className="table mb-0">{thead}</table>
      </div>
      <div style={{ maxHeight, overflow: "auto" }}>
        <table className="table">
          {colgroup}
          {tbody}
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
  isLoading: boolean;
}

interface IListProps {
  values: IListValue[];
  listOf: string;
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

const SummaryList: React.SFC<IListProps> = ({
  values,
  onCheckChanged,
  listOf
}) => {
  const filtered = values
    .filter(value => sumOfValues(value) > 0 || value.isLoading)
    .sort((a, b) => sumOfValues(b) - sumOfValues(a));

  let maxValue = 0;
  if (filtered.length > 0) {
    maxValue = sumOfValues(filtered[0]);
  }

  const rows = filtered.map(
    ({ label, value, commits, comments, isLoading }) => {
      const checkbox = (
        <Checkbox value={value} onCheckChanged={onCheckChanged} />
      );
      return (
        <tr key={value}>
          <td>{checkbox}</td>
          <td style={{ whiteSpace: "nowrap" }}>{label}</td>
          <td>
            {isLoading ? (
              <TitleLoader />
            ) : (
              <InlineStacked
                height={25}
                commits={commits}
                comments={comments}
                width={maxValue}
              />
            )}
          </td>
        </tr>
      );
    }
  );

  const numRows = rows.length;
  const summaryText =
    numRows === 1
      ? `${numRows} active ${listOf}`
      : `${numRows} active ${listOf}s`;

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
        <thead style={{ textTransform: "uppercase" }}>
          <tr className="small">
            <th style={{ fontWeight: "normal" }}>Filter</th>
            <th style={{ textAlign: "right" }}>{summaryText}</th>
          </tr>
        </thead>
      }
      tbody={<tbody>{rows}</tbody>}
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

const isRepoLoading = (
  repoName: string,
  commits: ICommitsAPIResult[],
  pulls: IPullsAPIResult[]
) => {
  const repoPulls = pulls.find(({ repo }) => repo === repoName);
  const repoCommits = commits.find(({ repo }) => repo === repoName);
  return !repoPulls || !repoCommits || repoCommits.is_pending;
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
        value: repo.name,
        isLoading: isRepoLoading(repo.name, commits, pulls)
      };
    });
    const isLoadingRepos = !!repoValues.find(({ isLoading }) => isLoading);
    const memberValues = members.map(member => {
      return {
        comments: getComments(pulls, period.current, selectedRepos, [
          member.login
        ]),
        commits: getCommits(commits, weekUnix, selectedRepos, [member.login]),
        label: getMemberName(member.login, members),
        value: member.login,
        isLoading: isLoadingRepos
      };
    });

    return (
      <Row className="mt-3">
        <Col className="col-6">
          <SummaryList
            listOf={"repo"}
            values={repoValues}
            onCheckChanged={this.onRepoFilterChanged}
          />
        </Col>
        <Col className="col-6">
          <SummaryList
            listOf={"member"}
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
