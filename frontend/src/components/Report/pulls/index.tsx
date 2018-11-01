import {
  getPRsOpened,
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullRequest,
  IPullsAPIResult,
  IRepo
} from "gitstats-shared";
import * as React from "react";
import { Container as WhiteContainer } from "reactstrap";
import { PRChartContainer } from "../../Charts/pulls";
import { getPRsReviewed } from "../base/utils";
import { Filters } from "../common/filters";
import { AuthorsTable } from "./tables/authors";
import { ReviewersTable } from "./tables/reviewers";

interface IContainerProps {
  repos: IRepo[];
  members: IMember[];
  period: IPeriod;
  isLoading: boolean;
  pulls: IPullsAPIResult[];
  commits: ICommitsAPIResult[];
}

interface IContainerState {
  filteredRepo: { value: string; label: string };
  filteredAuthor: { value: string; label: string };
  filteredReviewer: { value: string; label: string };
}

export class PullsContainer extends React.Component<
  IContainerProps,
  IContainerState
> {
  public state: IContainerState = {
    filteredAuthor: null,
    filteredRepo: null,
    filteredReviewer: null
  };

  public changeRepo = repo => {
    this.setState({ filteredRepo: repo });
  };

  public changeAuthor = member => {
    this.setState({ filteredAuthor: member });
  };

  public changeReviewer = member => {
    this.setState({ filteredReviewer: member });
  };

  public render() {
    const { period, isLoading, members, repos, pulls } = this.props;
    const { filteredAuthor, filteredRepo, filteredReviewer } = this.state;
    const selectedRepo = !!filteredRepo ? filteredRepo.value : undefined;
    const selectedAuthor = !!filteredAuthor ? filteredAuthor.value : undefined;
    const selectedReviewer = !!filteredReviewer
      ? filteredReviewer.value
      : undefined;
    const repoItems = repos.map(repo => {
      const metric = getPRsOpened(pulls, period, repo.name, selectedAuthor);
      return {
        label: `${repo.name} (${metric.current})`,
        value: repo.name
      };
    });
    const authorItems = members.map(member => {
      const metric = getPRsOpened(pulls, period, selectedRepo, member.login);
      return {
        label: `${member.name} (${metric.current})`,
        value: member.login
      };
    });
    const reviewerItems = members.map(member => {
      const selectedRepos = selectedRepo ? [selectedRepo] : [];
      const metric = getPRsReviewed(pulls, period.current, selectedRepos, [
        member.login
      ]);
      return {
        label: `${member.name} (${metric})`,
        value: member.login
      };
    });

    let chartData: IPullRequest[] = [];

    if (!!selectedRepo || !!selectedAuthor || !!selectedReviewer) {
      // At least one filter must be applied for the PR chart to show data
      chartData = pulls
        .filter(({ repo }) => !selectedRepo || repo === selectedRepo)
        .reduce((acc, curr) => [...acc, ...curr.pulls], [])
        .filter(({ author }) => !selectedAuthor || author === selectedAuthor)
        .filter(({ comments }) => {
          const hasCommentByReviewer =
            comments.filter(({ author }) => author === selectedReviewer)
              .length > 0;
          return !selectedReviewer || hasCommentByReviewer;
        });
    }

    return (
      <WhiteContainer>
        <h3>Code review metrics</h3>

        <AuthorsTable
          repos={this.props.repos}
          members={this.props.members}
          pulls={this.props.pulls}
          period={this.props.period}
        />

        <ReviewersTable
          repos={this.props.repos}
          members={this.props.members}
          pulls={this.props.pulls}
          period={this.props.period}
        />

        <Filters
          title={"Pull Requests"}
          repos={repoItems}
          changeRepo={this.changeRepo}
          authors={authorItems}
          changeAuthor={this.changeAuthor}
          reviewers={reviewerItems}
          changeReviewer={this.changeReviewer}
        />

        <PRChartContainer data={chartData} period={period} />
      </WhiteContainer>
    );
  }
}
