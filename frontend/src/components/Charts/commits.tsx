import { IComment, ICommit, IPeriod } from "gitstats-shared";
import * as React from "react";
import { getChartBounds } from "src/utils/date";
import { Streamgraph } from "./base/stream";

export interface IStreamgraphComment extends IComment {
  repo: string; // adds repo name to comment object
}

export interface IStreamgraphCommit extends ICommit {
  repo: string; // adds repo name to commit object
}

interface ICommitChartProps {
  period: IPeriod;
  data: {
    commits: IStreamgraphCommit[];
    prComments: IStreamgraphComment[];
  };
}

export class CommitChartContainer extends React.Component<
  ICommitChartProps,
  {}
> {
  public render() {
    const { startDate, endDate } = getChartBounds(this.props.period);
    const { data, prevData } = this.getChartData();

    const layeredData = data.reduce((result, current) => {
      const { type } = current;
      result[type] = !!result[type] ? [...result[type], current] : [current];
      return result;
    }, {});

    const layeredValues = Object.keys(layeredData).map(key => layeredData[key]);
    return (
      <div>
        <Streamgraph
          hasLegend={false}
          hasPrevComparison={false}
          data={layeredValues}
          prevData={[prevData]}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    );
  }

  private getPrevStart = () => {
    const { period } = this.props;
    const { startDate } = getChartBounds(period);
    const copy = new Date(startDate);
    return new Date(copy.setDate(copy.getDate() - 7));
  };

  private getFilteredByDate = (items, startTime, endTime) => {
    return items.filter(item => {
      const date = new Date(item.x);
      return date >= startTime && date <= endTime;
    });
  };

  private getChartData = () => {
    const { data, period } = this.props;
    const { commits, prComments } = data;
    const { startDate, endDate } = getChartBounds(period);
    const prevEnd = new Date(startDate);
    const prevStart = this.getPrevStart();

    const allData = [];
    commits.forEach(commit => {
      const { author, message, repo, date } = commit;
      allData.push({
        author,
        message,
        repo,
        type: "commit",
        x: date,
        y: 1
      });
    });
    prComments.forEach(comment => {
      const { author, repo, date } = comment;
      allData.push({
        author,
        repo,
        type: "pr_comment",
        x: date,
        y: 1
      });
    });

    return {
      data: this.getFilteredByDate(allData, startDate, endDate),
      prevData: this.getFilteredByDate(allData, prevStart, prevEnd)
    };
  };
}
