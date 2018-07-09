import React from "react";
import { Value, getCommits, getPRsMerged, getLinesChanged } from "./utils";

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

export const Repos = ({ repos }) => {
  const data = repos
    .map(repo => {
      return {
        ...repo,
        commits: getCommits(repos.filter(r => r.name === repo.name)),
        prsMerged: getPRsMerged(repos.filter(r => r.name === repo.name)),
        linesChanged: getLinesChanged(repos.filter(r => r.name === repo.name))
      };
    })
    .sort((a, b) => b.commits.next - a.commits.next);

  return (
    <table className="table table-hover">
      <thead className="thead-light">
        <tr>
          <th style={{ width: "40%" }}>Repository</th>
          <th style={{ width: "20%" }}>Commits</th>
          <th style={{ width: "20%" }}>PRs merged</th>
          <th style={{ width: "20%" }}>Lines changed</th>
        </tr>
      </thead>
      <tbody>
        {data.map(repo => {
          const isActive = repo.commits.previous || repo.commits.next;
          return isActive ? (
            <tr key={repo.name}>
              <td>
                <RepoName {...repo} />
              </td>
              <td>
                <Value {...repo.commits} />
              </td>
              <td>
                <Value {...repo.prsMerged} />
              </td>
              <td>
                <Value {...repo.linesChanged} />
              </td>
            </tr>
          ) : null;
        })}
      </tbody>
    </table>
  );
};
