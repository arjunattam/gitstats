import {
  IComment,
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
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
import { GrayContainer } from "../common";
import { SummaryTable } from "./table";

interface IContainerProps {
  repos: IRepo[];
  members: IMember[];
  period: IPeriod;
  isLoading: boolean;
  pulls: IPullsAPIResult[];
  commits: ICommitsAPIResult[];
}

interface IContainerState {
  selectedRepos: string[];
  selectedMembers: string[];
}

export class SummaryContainer extends React.Component<IContainerProps, {}> {
  public state: IContainerState = {
    selectedMembers: [],
    selectedRepos: []
  };

  public render() {
    const { period, isLoading, pulls, commits } = this.props;
    const { selectedMembers, selectedRepos } = this.state;

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

    return (
      <GrayContainer>
        <h4>Activity summary</h4>

        <Row>
          <Col className="col-4">
            <BarChart
              xAxisTitle={"LAST 5 WEEKS"}
              data={chartData}
              color={CHART_COLORS.commit}
              textColor={"#666"}
            />
          </Col>
          <Col className="col-8">
            <CommitChartContainer
              period={period}
              commits={chartCommitsData}
              prComments={chartCommentsData}
            />
          </Col>
        </Row>

        <SummaryTable
          {...this.props}
          {...this.state}
          onRepoSelected={this.onRepoSelected}
          onMemberSelected={this.onMemberSelected}
        />
      </GrayContainer>
    );
  }

  private onRepoSelected = selectedRepos => {
    this.setState({ selectedRepos });
  };

  private onMemberSelected = selectedMembers => {
    this.setState({ selectedMembers });
  };
}
