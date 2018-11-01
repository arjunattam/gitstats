import { getPRsCommentTime, getPRsMerged } from "gitstats-shared";
import * as React from "react";
// import { getDurationLabel } from "src/utils/date";
import Table from "./table";
import { getCommits, Value } from "./utils";

const RepoName = ({ name, url, description }) => {
  return (
    <div>
      <a href={url} target="_blank">
        {name}
      </a>{" "}
      <small className="text-muted">{description}</small>
    </div>
  );
};

export const ReposTable = ({ period, reposDeprecated, pulls, isLoading }) => {
  const repos = reposDeprecated;
  const deprecatedPeriod = {
    next: period.current.start,
    previous: period.previous.start
  };

  const data = repos
    ? repos
        .map(repo => {
          const prsMerged = getPRsMerged(pulls, period, repo.name, undefined);
          const commentTimes = getPRsCommentTime(
            pulls,
            period,
            repo.name,
            undefined
          );
          return {
            ...repo,
            commentTimes: {
              next: commentTimes.current,
              previous: commentTimes.previous
            },
            commits: getCommits(
              deprecatedPeriod,
              repos.filter(r => r.name === repo.name)
            ),
            prsMerged: {
              next: prsMerged.current,
              previous: prsMerged.previous
            }
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
      isLoading: d.stats.is_pending,
      key: d.name,
      values: [
        <RepoName {...d} />,
        <Value {...d.commits} />,
        <Value {...d.prsMerged} />,
        <Value {...d.commentTimes} />
      ]
    };
  });

  return (
    <Table
      rowHeadings={["Repository", "Commits", "PRs merged", "Time to comment"]}
      rowLimit={3}
      isLoading={isLoading}
      rowData={rowData}
    />
  );
};
