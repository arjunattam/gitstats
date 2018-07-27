import React from "react";
import {
  Value,
  Member,
  getCommits,
  getPRsMerged,
  getLinesChanged
} from "./utils";
import Table from "./table";

export const Members = ({ repos, members, isLoading }) => {
  const hasAllData = repos
    ? !repos.filter(repo => repo.stats.is_pending).length
    : false;
  const data = members
    ? members
        .map(member => {
          return {
            ...member,
            commits: getCommits(repos, member.login),
            prsMerged: getPRsMerged(repos, member.login),
            linesChanged: getLinesChanged(repos, member.login)
          };
        })
        .sort((a, b) => b.commits.next - a.commits.next)
        .filter(member => member.commits.previous || member.commits.next)
    : [];
  const rowData = data.map(d => ({
    key: d.login,
    isLoading: !hasAllData,
    values: [
      <Member {...d} />,
      <Value {...d.commits} />,
      <Value {...d.prsMerged} />,
      <Value {...d.linesChanged} />
    ]
  }));

  return (
    <Table
      rowHeadings={["Member", "Commits", "PRs merged", "Lines changed"]}
      rowLimit={5}
      isLoading={isLoading}
      rowData={rowData}
    />
  );
};
