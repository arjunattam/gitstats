import React from "react";
import { Value, getCommits, getPRsMerged } from "./utils";
import Table from "./table";
import { MemberName } from "../Common";

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
            <MemberName login={owner.name} avatar={owner.avatar} />,
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
