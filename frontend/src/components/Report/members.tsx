import { getPRsCommentTime, getPRsMerged } from "gitstats-shared";
import * as React from "react";
import { getDurationLabel } from "src/utils/date";
import { MemberName } from "../Common";
import Table from "./table";
import { getCommits, Value } from "./utils";

export const MembersTable = ({ period, repos, pulls, members, isLoading }) => {
  const deprecatedPeriod = {
    next: period.current.start,
    previous: period.previous.start
  };

  const hasAllData = repos
    ? !repos.filter(repo => repo.stats.is_pending).length
    : false;

  const data = members
    ? members
        .map(member => {
          const prsMerged = getPRsMerged(
            pulls,
            period,
            undefined,
            member.login
          );
          const commentTimes = getPRsCommentTime(
            pulls,
            period,
            undefined,
            member.login
          );
          return {
            ...member,
            commentTimes: {
              next: commentTimes.current,
              previous: commentTimes.previous
            },
            commits: getCommits(deprecatedPeriod, repos, member.login),
            prsMerged: {
              next: prsMerged.current,
              previous: prsMerged.previous
            }
          };
        })
        .filter(member => member.commits.previous || member.commits.next)
        .sort((a, b) => b.commits.next - a.commits.next)
    : [];
  const rowData = data.map(d => ({
    isLoading: !hasAllData,
    key: d.login,
    values: [
      <MemberName {...d} />,
      <Value {...d.commits} />,
      <Value {...d.prsMerged} />,
      <Value {...d.commentTimes} transformer={getDurationLabel} />
    ]
  }));

  return (
    <Table
      rowHeadings={["Member", "Commits", "PRs merged", "Time to comment"]}
      rowLimit={3}
      isLoading={isLoading}
      rowData={rowData}
    />
  );
};
