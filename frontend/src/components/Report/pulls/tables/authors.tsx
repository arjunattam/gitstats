import {
  durationInWords,
  getPRsMerged,
  getPRsMergeTime,
  getPRsOpened
} from "gitstats-shared";
import * as React from "react";
import { getPRsApproved } from "../../base/utils";
import { BasePRMetricsTable } from "./base";

export class AuthorsTable extends BasePRMetricsTable {
  protected getValues(selectedRepo) {
    const { period, pulls, members } = this.props;
    return members
      .map(member => {
        const { current: prsOpened } = getPRsOpened(
          pulls,
          period,
          selectedRepo,
          member.login
        );
        const { current: prsMerged } = getPRsMerged(
          pulls,
          period,
          selectedRepo,
          member.login
        );
        const { current: mergeTime } = getPRsMergeTime(
          pulls,
          period,
          selectedRepo,
          member.login
        );

        return {
          member,
          mergeTime: durationInWords(mergeTime),
          prsApproved: getPRsApproved(
            pulls,
            period.current,
            !!selectedRepo ? [selectedRepo] : [],
            [member.login]
          ),
          prsMerged,
          prsOpened,
          value: member.login
        };
      })
      .filter(({ prsOpened, prsMerged }) => prsOpened || prsMerged)
      .map(result => ({
        member: result.member,
        values: [
          result.prsOpened,
          result.prsApproved,
          result.prsMerged,
          result.mergeTime
        ]
      }));
  }

  protected getTotal(selectedRepo) {
    const { period, pulls } = this.props;
    const totalValues = {
      member: { name: "TOTAL", login: "total" },
      mergeTime: durationInWords(
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
    return {
      name: "All authors",
      values: [
        totalValues.prsOpened,
        totalValues.prsApproved,
        totalValues.prsMerged,
        totalValues.mergeTime
      ]
    };
  }

  protected getTableHeadRow() {
    return (
      <tr>
        <th>Name</th>
        <th>New PRs opened</th>
        <th>PRs approved</th>
        <th>PRs merged</th>
        <th>Median time to merge</th>
      </tr>
    );
  }

  protected getTableTitle() {
    return "Metrics for authors";
  }
}
