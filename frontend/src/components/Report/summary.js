import React from "react";
import { Value, Member, getCommits, getPRsMerged } from "./utils";
import Table from "./table";

export const Summary = ({ period, owner, repos, isLoading }) => {
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
            <Value {...getCommits(period, repos)} />,
            <Value {...getPRsMerged(period, repos)} />
          ]
        }
      ]
    : [{}];

  return (
    <Table
      rowHeadings={["Team", "Commits", "PRs merged"]}
      rowLimit={5}
      isLoading={isLoading}
      rowData={rowData}
    />
  );
};
