import React from "react";
import { Value, getCommits, getPRsMerged } from "./utils";
import Table from "./table";
import { MemberName } from "../Common";

export const Members = ({ period, repos, members, isLoading }) => {
  const hasAllData = repos
    ? !repos.filter(repo => repo.stats.is_pending).length
    : false;
  const data = members
    ? members
        .map(member => {
          return {
            ...member,
            commits: getCommits(period, repos, member.login),
            prsMerged: getPRsMerged(period, repos, member.login)
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
      rowLimit={5}
      isLoading={isLoading}
      rowData={rowData}
    />
  );
};
