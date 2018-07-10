import React from "react";
import {
  Value,
  Member,
  getCommits,
  getPRsMerged,
  getLinesChanged
} from "./utils";
import Table from "./table";

export const Summary = ({ owner, repos, isLoading }) => {
  const hasAllData = repos
    ? !repos.filter(repo => repo.stats.is_pending).length
    : false;
  const rowData = owner
    ? [
        {
          key: "summary",
          isLoading: !hasAllData,
          values: [
            <Member login={owner.name} avatar={owner.avatar} />,
            <Value {...getCommits(repos)} />,
            <Value {...getPRsMerged(repos)} />,
            <Value {...getLinesChanged(repos)} />
          ]
        }
      ]
    : [{}];
  return (
    <Table
      rowHeadings={["Team", "Commits", "PRs merged", "Lines changed"]}
      rowLimit={5}
      isLoading={isLoading}
      rowData={rowData}
    />
  );
};
