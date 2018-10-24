import { getPRsMerged } from "gitstats-shared";
import React from "react";
import { Value, getCommits } from "./utils";
import Table from "./table";
import { MemberName } from "../Common";

export const Members = ({ period, repos, pulls, members, isLoading }) => {
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
          return {
            ...member,
            commits: getCommits(deprecatedPeriod, repos, member.login),
            prsMerged: { next: prsMerged.current, previous: prsMerged.previous }
          };
        })
        .filter(member => member.commits.previous || member.commits.next)
        .sort((a, b) => b.commits.next - a.commits.next)
    : [];
  const rowData = data.map(d => ({
    key: d.login,
    isLoading: !hasAllData,
    values: [
      <MemberName {...d} />,
      <Value {...d.commits} />,
      <Value {...d.prsMerged} />
    ]
  }));

  return (
    <Table
      rowHeadings={["Member", "Commits", "PRs merged"]}
      rowLimit={3}
      isLoading={isLoading}
      rowData={rowData}
    />
  );
};
