import React from "react";
import {
  Value,
  Member,
  getCommits,
  getPRsMerged,
  getLinesChanged
} from "./utils";

export const Summary = ({ owner, repos }) => {
  return (
    <table className="table">
      <thead className="thead-light">
        <tr>
          <th style={{ width: "40%" }}>Team</th>
          <th style={{ width: "20%" }}>Commits</th>
          <th style={{ width: "20%" }}>PRs merged</th>
          <th style={{ width: "20%" }}>Lines changed</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <Member
              login={owner ? owner.name : null}
              avatar={owner ? owner.avatar : null}
            />
          </td>
          <td>
            <Value {...getCommits(repos)} />
          </td>
          <td>
            <Value {...getPRsMerged(repos)} />
          </td>
          <td>
            <Value {...getLinesChanged(repos)} />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
