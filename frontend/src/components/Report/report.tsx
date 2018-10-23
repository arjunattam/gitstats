import { CommitsAPIResult, Team } from "gitstats-shared";
import * as React from "react";
import { ICommits, IPullRequestData, IReportJson } from "../../types";
import { getCommitsV2, getPullsV2, getTeamInfo } from "../../utils/api";
import { getPeriod, getWeekStart } from "../../utils/date";
import { ReportContainer } from "./container";
import { EmailContainer } from "./email";
import { Header } from "./header";

interface IReportProps {
  teamLogin: string;
  team?: Team;
}

interface IReportState {
  weekStart: string;
  prActivityData: IPullRequestData[];
  commitsData: ICommits[];
  reportJson: IReportJson;
  isLoading: boolean;
  team?: Team;
}

export class Report extends React.Component<IReportProps, IReportState> {
  public state: IReportState = {
    commitsData: [],
    isLoading: true,
    prActivityData: [],
    reportJson: {
      members: [],
      repos: []
    },
    weekStart: ""
  };

  public componentDidUpdate(prevProps: IReportProps, prevState) {
    const { teamLogin: newOwner } = this.props;
    const { teamLogin: prevOwner } = prevProps;

    if (newOwner !== prevOwner) {
      this.setState({
        isLoading: true,
        reportJson: { members: [], repos: [] }
      });
      this.update();
    }
  }

  public componentDidMount() {
    this.setState({ weekStart: getWeekStart() }, () => this.update());
  }

  public render() {
    const { team: propsTeam, teamLogin } = this.props;
    const { weekStart, team: stateTeam } = this.state;
    const period = getPeriod(weekStart);
    const team = !!propsTeam && !!propsTeam.name ? propsTeam : stateTeam;

    return (
      <div>
        <Header team={team} weekStart={weekStart} />
        <ReportContainer {...this.state} period={period} />
        <EmailContainer teamLogin={teamLogin} weekStart={weekStart} />
      </div>
    );
  }

  private update() {
    const { teamLogin } = this.props;
    const { weekStart } = this.state;

    getTeamInfo(teamLogin, weekStart).then(response => {
      const { login: teamName, repos, members } = response;
      const reportRepos = repos.map(repo => {
        return {
          ...repo,
          stats: {
            authors: [],
            is_pending: true
          },
          prs: []
        };
      });

      this.setState({
        isLoading: false,
        reportJson: {
          members,
          repos: reportRepos
        },
        team: {
          avatar: response.avatar,
          login: response.login,
          name: response.name,
          service: response.service
        }
      });

      repos.forEach(({ name }) => {
        this.fetchRepoData(teamName, name, weekStart);
      });
    });
  }

  private fetchRepoData(teamLogin, repoName, weekStart) {
    getCommitsV2(teamLogin, repoName, weekStart).then(response => {
      this.handleCommitsResponse(repoName, response);
    });

    getPullsV2(teamLogin, repoName, weekStart).then(({ repo, pulls }) => {
      const { prActivityData } = this.state;
      this.setState({
        prActivityData: [...prActivityData, { repo, pulls }]
      });
    });
  }

  private handleCommitsResponse = (
    repoName: string,
    response: CommitsAPIResult
  ) => {
    const { repo, commits, is_pending, stats } = response;
    const authorWiseCommits = {};

    if (is_pending) {
      // Wait for Github background job; fire request in 2 seconds
      const { teamLogin } = this.props;
      const { weekStart } = this.state;
      setTimeout(() => {
        getCommitsV2(teamLogin, repoName, weekStart).then(result =>
          this.handleCommitsResponse(repoName, result)
        );
      }, 2000);
    }

    commits.forEach(commit => {
      const { author } = commit;

      if (author in authorWiseCommits) {
        authorWiseCommits[author] = [...authorWiseCommits[author], commit];
      } else {
        authorWiseCommits[author] = [commit];
      }
    });

    const authors = Object.keys(authorWiseCommits);
    const commitsResult = authors.map(author => {
      return { author, commits: authorWiseCommits[author] };
    });
    const { commitsData } = this.state;

    this.setState({
      commitsData: [...commitsData, { repo, commits: commitsResult }]
    });

    const reportStats = {
      authors: stats.map(authorStats => ({
        ...authorStats,
        login: authorStats.author
      })),
      is_pending
    };
    const { reportJson } = this.state;
    this.setState({
      reportJson: {
        ...reportJson,
        repos: reportJson.repos.map(reportRepo => {
          if (reportRepo.name === repoName) {
            return { ...reportRepo, stats: reportStats };
          } else {
            return reportRepo;
          }
        })
      }
    });
  };
}
