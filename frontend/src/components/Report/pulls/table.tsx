import {
  getPRsCommentTime,
  getPRsMerged,
  getPRsMergeTime,
  getPRsOpened,
  IMember,
  IPeriod,
  IPullsAPIResult
} from "gitstats-shared";
import * as React from "react";
import { getDurationLabel } from "src/utils/date";
import { getComments, getPRsApproved, getPRsReviewed } from "../base/utils";

const AuthorTableRow = ({
  label,
  prsOpened,
  prsApproved,
  prsMerged,
  mergeTime
}) => {
  return (
    <tr>
      <td>{label}</td>
      <td>{prsOpened}</td>
      <td>{prsApproved}</td>
      <td>{prsMerged}</td>
      <td>{mergeTime}</td>
    </tr>
  );
};

interface IPullsTableProps {
  pulls: IPullsAPIResult[];
  period: IPeriod;
  members: IMember[];
}

interface IPullsTableState {
  selectedRepo: string;
}

export class AuthorsTable extends React.Component<
  IPullsTableProps,
  IPullsTableState
> {
  public state: IPullsTableState = {
    selectedRepo: undefined
  };

  public render() {
    const { period, pulls, members } = this.props;
    const { selectedRepo } = this.state;
    const values = members
      .map(({ login, name }) => {
        const { current: prsOpened } = getPRsOpened(
          pulls,
          period,
          selectedRepo,
          login
        );
        const { current: prsMerged } = getPRsMerged(
          pulls,
          period,
          selectedRepo,
          login
        );
        const { current: mergeTime } = getPRsMergeTime(
          pulls,
          period,
          selectedRepo,
          login
        );

        return {
          label: name,
          mergeTime: getDurationLabel(mergeTime),
          prsApproved: getPRsApproved(
            pulls,
            period.current,
            !!selectedRepo ? [selectedRepo] : [],
            [login]
          ),
          prsMerged,
          prsOpened,
          value: login
        };
      })
      .filter(({ prsOpened, prsMerged }) => prsOpened || prsMerged);

    const totalValues = {
      label: "TOTAL",
      mergeTime: getDurationLabel(
        getPRsMergeTime(pulls, period, selectedRepo, undefined).current
      ),
      prsApproved: getPRsApproved(
        pulls,
        period.current,
        !!selectedRepo ? [selectedRepo] : [],
        []
      ),
      prsMerged: getPRsMerged(pulls, period, selectedRepo, undefined).current,
      prsOpened: getPRsOpened(pulls, period, selectedRepo, undefined).current,
      value: "total"
    };

    return (
      <div>
        <h4>Metrics for authors</h4>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>New PRs opened</th>
              <th>PRs approved</th>
              <th>PRs merged</th>
              <th>Median time to merge</th>
            </tr>
          </thead>
          <tbody>
            {[totalValues, ...values].map(row => {
              return <AuthorTableRow {...row} key={row.value} />;
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

const ReviewerTableRow = ({
  label,
  prsAssigned,
  prsReviewed,
  comments,
  reviewTime
}) => {
  return (
    <tr>
      <td>{label}</td>
      <td>{prsAssigned}</td>
      <td>{prsReviewed}</td>
      <td>{comments}</td>
      <td>{reviewTime}</td>
    </tr>
  );
};

// tslint:disable-next-line:max-classes-per-file
export class ReviewersTable extends React.Component<IPullsTableProps, {}> {
  public render() {
    const { period, pulls, members } = this.props;
    const values = members
      .map(member => {
        return {
          comments: getComments(pulls, period.current, [], [member.login]),
          label: member.name,
          prsAssigned: 0,
          prsReviewed: getPRsReviewed(
            pulls,
            period.current,
            [],
            [member.login]
          ),
          reviewTime: getDurationLabel(
            getPRsCommentTime(pulls, period, undefined, member.login).current
          ),
          value: member.login
        };
      })
      .filter(({ prsAssigned, prsReviewed }) => prsAssigned || prsReviewed);

    const totalValues = {
      comments: getComments(pulls, period.current, [], []),
      label: "TOTAL",
      prsAssigned: 0,
      prsReviewed: getPRsReviewed(pulls, period.current, [], []),
      reviewTime: getDurationLabel(
        getPRsCommentTime(pulls, period, undefined, undefined).current
      ),
      value: "total"
    };

    return (
      <div>
        <h4>Metrics for reviewers</h4>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>PRs assigned</th>
              <th>PRs reviewed</th>
              <th>Comments</th>
              <th>Median time to review</th>
            </tr>
          </thead>
          <tbody>
            {[totalValues, ...values].map(row => {
              return <ReviewerTableRow {...row} key={row.value} />;
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
