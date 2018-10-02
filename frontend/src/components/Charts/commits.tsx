import * as React from "react";
import { Streamgraph } from "./base/stream";

const ALL_REPOS = "All repos";
const ALL_MEMBERS = "All members";

interface ICommitChartContainerProps {
  startDate: Date;
  endDate: Date;
  commitsData: ICommits[];
  prData: IPullRequestData[];
  selectedRepo: string;
  selectedMember: string;
}

export class CommitChartContainer extends React.Component<
  ICommitChartContainerProps,
  {}
> {
  public render() {
    const { startDate, endDate } = this.props;
    const { data, prevData } = this.getChartData();
    const dataFiltered = this.filterBySelection(data);
    const prevFiltered = this.filterBySelection(prevData);

    const layeredData = dataFiltered.reduce((result, current) => {
      const { type } = current;
      result[type] = !!result[type] ? [...result[type], current] : [current];
      return result;
    }, {});

    const layeredValues = Object.keys(layeredData).map(key => layeredData[key]);
    return (
      <div>
        <Streamgraph
          data={layeredValues}
          prevData={[prevFiltered]}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    );
  }

  private getPrevStart = () => {
    const copy = new Date(this.props.startDate);
    return new Date(copy.setDate(copy.getDate() - 7));
  };

  private getFilteredByDate = (items, startTime, endTime) => {
    return items.filter(item => {
      const date = new Date(item.x);
      return date >= startTime && date <= endTime;
    });
  };

  private getChartData = () => {
    const { commitsData, prData, startDate, endDate } = this.props;
    const prevEnd = new Date(startDate);
    const prevStart = this.getPrevStart();

    const allData = [];
    // Each entity has x (date), y, type, author, repo
    commitsData.forEach(repoCommits => {
      const { repo, commits } = repoCommits;

      commits.forEach(authorCommits => {
        const { author, commits } = authorCommits;
        commits.forEach(commitObject => {
          const { message, date } = commitObject;
          allData.push({
            author,
            message,
            repo,
            type: "commit",
            x: date,
            y: 1
          });
        });
      });
    });

    prData.forEach(repoPrItems => {
      const { repo, pulls } = repoPrItems;
      pulls.forEach(prItem => {
        const { comments } = prItem;
        comments.forEach(comment => {
          // TODO: comment does not have message
          const { author, date } = comment;
          allData.push({
            author,
            repo,
            type: "pr_comment",
            x: date,
            y: 1
          });
        });
      });
    });

    return {
      data: this.getFilteredByDate(allData, startDate, endDate),
      prevData: this.getFilteredByDate(allData, prevStart, prevEnd)
    };
  };

  private filterBySelection = (data, excludeKey?) => {
    const { selectedRepo, selectedMember } = this.props;
    return data
      .filter(
        item =>
          excludeKey === "repo" ||
          selectedRepo === ALL_REPOS ||
          item.repo === selectedRepo
      )
      .filter(
        item =>
          excludeKey === "author" ||
          selectedMember === ALL_MEMBERS ||
          item.author === selectedMember
      );
  };
}
