import { durationInWords, getPRsCommentTime } from "gitstats-shared";
import * as React from "react";
import { getComments, getPRsReviewed } from "../../base/utils";
import { BasePRMetricsTable } from "./base";

export class ReviewersTable extends BasePRMetricsTable {
  protected getValues(selectedRepo: string) {
    const { period, pulls, members } = this.props;
    const selectedRepos = !!selectedRepo ? [selectedRepo] : [];
    return members
      .map(member => {
        const comments = getComments(pulls, period.current, selectedRepos, [
          member.login
        ]);
        const prsAssigned = 0;
        const prsReviewed = getPRsReviewed(
          pulls,
          period.current,
          selectedRepos,
          [member.login]
        );
        const reviewTime = durationInWords(
          getPRsCommentTime(pulls, period, selectedRepo, member.login).current
        );

        return {
          member,
          values: [prsAssigned, prsReviewed, comments, reviewTime]
        };
      })
      .filter(({ values }) => values[0] || values[1]);
  }

  protected getTotal(selectedRepo: string) {
    const { period, pulls } = this.props;
    const selectedRepos = !!selectedRepo ? [selectedRepo] : [];
    const comments = getComments(pulls, period.current, selectedRepos, []);
    const member = { name: "TOTAL", login: "total" };
    const prsAssigned = 0;
    const prsReviewed = getPRsReviewed(
      pulls,
      period.current,
      selectedRepos,
      []
    );
    const reviewTime = durationInWords(
      getPRsCommentTime(pulls, period, selectedRepo, undefined).current
    );
    return {
      member,
      values: [prsAssigned, prsReviewed, comments, reviewTime]
    };
  }

  protected getTableHeadRow() {
    return (
      <tr>
        <th>Name</th>
        <th>PRs assigned</th>
        <th>PRs reviewed</th>
        <th>Comments</th>
        <th>Median time to review</th>
      </tr>
    );
  }

  protected getTableTitle() {
    return "Metrics for reviewers";
  }
}
