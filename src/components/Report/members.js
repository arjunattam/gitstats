import React from "react";
import {
  Value,
  Member,
  getCommits,
  getPRsMerged,
  getLinesChanged
} from "./utils";

export const Members = ({ repos, members }) => {
  const data = members
    .map(member => {
      return {
        ...member,
        commits: getCommits(repos, member.login),
        prsMerged: getPRsMerged(repos, member.login),
        linesChanged: getLinesChanged(repos, member.login)
      };
    })
    .sort((a, b) => b.commits.next - a.commits.next);

  return (
    <table className="table table-hover">
      <thead className="thead-light">
        <tr>
          <th style={{ width: "40%" }}>Members</th>
          <th style={{ width: "20%" }}>Commits</th>
          <th style={{ width: "20%" }}>PRs merged</th>
          <th style={{ width: "20%" }}>Lines changed</th>
        </tr>
      </thead>
      <tbody>
        {data.map(member => {
          const isActive = member.commits.previous || member.commits.next;
          return isActive ? (
            <tr key={member.login}>
              <td>
                <Member {...member} />
              </td>
              <td>
                <Value {...member.commits} />
              </td>
              <td>
                <Value {...member.prsMerged} />
              </td>
              <td>
                <Value {...member.linesChanged} />
              </td>
            </tr>
          ) : null;
        })}
      </tbody>
    </table>
  );
};
