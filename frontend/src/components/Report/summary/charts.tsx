import { IComment } from "gitstats-shared";
import * as React from "react";
import { Col, Row } from "reactstrap";
import { BarChart } from "../../Charts/base/bar";
import { CHART_COLORS } from "../../Charts/base/utils";
import {
  CommitChartContainer,
  IStreamgraphComment,
  IStreamgraphCommit
} from "../../Charts/commits";
import { getCommitsChartData, isSelected } from "../base/utils";

const ChartsRow = ({ period, barChartData, commitsChartData }) => {
  return (
    <Row>
      <Col className="col-4">
        <BarChart
          xAxisTitle={"LAST 5 WEEKS"}
          data={barChartData}
          color={CHART_COLORS.commit}
          textColor={"#666"}
        />
      </Col>
      <Col className="col-8">
        <CommitChartContainer period={period} data={commitsChartData} />
      </Col>
    </Row>
  );
};

export const SummaryCharts = props => {
  const { period, pulls, commits } = props;
  const { selectedMembers, selectedRepos } = props;

  const chartData = getCommitsChartData(
    commits,
    selectedRepos,
    selectedMembers
  );

  const chartCommitsData: IStreamgraphCommit[] = commits
    .filter(({ is_pending }) => !is_pending)
    .filter(({ repo }) => isSelected(selectedRepos, repo))
    .reduce((acc, current) => {
      const { repo, commits: commitsData } = current;
      const filteredCommits = commitsData.filter(({ author }) =>
        isSelected(selectedMembers, author)
      );
      return [...acc, filteredCommits.map(c => ({ ...c, repo }))];
    }, [])
    .reduce((acc, current) => [...acc, ...current], []);

  const chartCommentsData: IStreamgraphComment[] = pulls
    .filter(({ repo }) => isSelected(selectedRepos, repo))
    .reduce((acc, current) => {
      const { repo, pulls: repoPulls } = current;
      const pullComments: IComment[] = repoPulls.reduce(
        (allComments, currentPR) => [...allComments, ...currentPR.comments],
        []
      );
      const filteredComments = pullComments.filter(({ author }) =>
        isSelected(selectedMembers, author)
      );
      return [...acc, filteredComments.map(c => ({ ...c, repo }))];
    }, [])
    .reduce((acc, current) => [...acc, ...current], []);

  const commitsChartData = {
    commits: chartCommitsData,
    prComments: chartCommentsData
  };

  return (
    <ChartsRow
      period={period}
      barChartData={chartData}
      commitsChartData={commitsChartData}
    />
  );
};
