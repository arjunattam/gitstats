import React from "react";
import { Value, getCommits, getPRsMerged } from "./utils";
import Table from "./table";

const RepoName = ({ name, description }) => {
  return (
    <div>
      {name}
      <div>
        <small>{description}</small>
      </div>
    </div>
  );
};

export const Repos = ({ period, repos, isLoading }) => {
  const data = repos
    ? repos
        .map(repo => {
          return {
            ...repo,
            commits: getCommits(
              period,
              repos.filter(r => r.name === repo.name)
            ),
            prsMerged: getPRsMerged(
              period,
              repos.filter(r => r.name === repo.name)
            )
          };
        })
        .sort((a, b) => b.commits.next - a.commits.next)
        .filter(
          repo =>
            repo.stats.is_pending || repo.commits.previous || repo.commits.next
        )
    : [];

  const rowData = data.map(d => {
    return {
      key: d.name,
      isLoading: d.stats.is_pending,
      values: [
        <RepoName {...d} />,
        <Value {...d.commits} />,
        <Value {...d.prsMerged} />
      ]
    };
  });

  return (
    <Table
      rowHeadings={["Repository", "Commits", "PRs merged"]}
      rowLimit={5}
      isLoading={isLoading}
      rowData={rowData}
    />
  );
};
