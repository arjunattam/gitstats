import {
  getPeriodLastSevenDays,
  getPeriodLastWeek,
  ICommitsAPIResult,
  IMember,
  IPeriod,
  IPullsAPIResult,
  IRepo,
  ITeam
} from "gitstats-shared";
import * as React from "react";
import { getGitService } from "src/utils/auth";
import { ICommitsDeprecated, RepoForReport } from "../../types";
import { getCommits, getPulls, getTeamInfo } from "../../utils/api";
import { ReportContainer } from "./container";
import { EmailContainer } from "./email";
import { Header } from "./header";

interface IReportProps {
  teamLogin: string;
  team?: ITeam;
}

interface IReportState {
  period: IPeriod;
  repos: IRepo[];
  pulls: IPullsAPIResult[];
  commits: ICommitsAPIResult[];
  members: IMember[];
  team?: ITeam;
  isLoading: boolean;
  commitsDeprecated: ICommitsDeprecated[];
  reposDeprecated: RepoForReport[];
}

export class Report extends React.Component<IReportProps, IReportState> {
  public state: IReportState = {
    commitsDeprecated: [],
    isLoading: true,
    members: [],
    period: undefined,
    pulls: [],
    repos: [],
    commits: [],
    reposDeprecated: []
  };

  public componentDidUpdate(prevProps: IReportProps, prevState) {
    const { teamLogin: newOwner } = this.props;
    const { teamLogin: prevOwner } = prevProps;

    if (newOwner !== prevOwner) {
      this.setState({
        isLoading: true,
        members: [],
        reposDeprecated: []
      });
      this.update();
    }
  }

  public componentDidMount() {
    let period;
    const { team } = this.props;
    let service = !!team ? team.service : undefined;

    if (!service) {
      service = getGitService();
    }

    if (service === "bitbucket") {
      period = getPeriodLastSevenDays();
    } else {
      // Because github stats API returns commits from Sun-Sat only
      period = getPeriodLastWeek();
    }

    this.setState({ period }, () => this.update());
  }

  public render() {
    const { period } = this.state;

    if (!period) {
      return null;
    }

    const { teamLogin } = this.props;
    const weekStart = this.getWeekStart();
    const team = this.getTeam();

    return (
      <div>
        <Header team={team} period={period} />
        <ReportContainer {...this.state} />
        <EmailContainer teamLogin={teamLogin} weekStart={weekStart} />
      </div>
    );
  }

  private getTeam(): ITeam {
    const { team: propsTeam } = this.props;
    const { team: stateTeam } = this.state;
    return !!propsTeam && !!propsTeam.name ? propsTeam : stateTeam;
  }

  private getWeekStart(): string {
    const { period } = this.state;
    return period.current.start.substr(0, 10);
  }

  private update() {
    const { teamLogin } = this.props;
    const weekStart = this.getWeekStart();

    getTeamInfo(teamLogin, weekStart).then(response => {
      const { login: teamName, repos, members } = response;
      const reportRepos = repos.map(repo => {
        return {
          ...repo,
          stats: {
            authors: [],
            is_pending: true
          }
        };
      });

      this.setState({
        isLoading: false,
        members,
        repos,
        reposDeprecated: reportRepos,
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
    getCommits(teamLogin, repoName, weekStart).then(response => {
      const { commits } = this.state;
      this.setState({
        commits: [...commits, response]
      });

      this.handleCommitsResponse(repoName, response);
    });

    getPulls(teamLogin, repoName, weekStart).then(
      ({ repo, pulls: pullsResponse }) => {
        const { pulls } = this.state;
        this.setState({
          pulls: [...pulls, { repo, pulls: pullsResponse }]
        });
      }
    );
  }

  private handleCommitsResponse = (
    repoName: string,
    response: ICommitsAPIResult
  ) => {
    const { repo, commits: commitsResponse, is_pending, stats } = response;
    const authorWiseCommits = {};

    if (is_pending) {
      // Wait for Github background job; fire request in 2 seconds
      const { teamLogin } = this.props;
      const weekStart = this.getWeekStart();

      setTimeout(() => {
        getCommits(teamLogin, repoName, weekStart).then(result =>
          this.handleCommitsResponse(repoName, result)
        );
      }, 2000);
    }

    commitsResponse.forEach(commit => {
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
    const { commitsDeprecated } = this.state;

    this.setState({
      commitsDeprecated: [
        ...commitsDeprecated,
        { repo, commits: commitsResult }
      ]
    });

    const reportStats = {
      authors: stats.map(authorStats => ({
        ...authorStats,
        login: authorStats.author
      })),
      is_pending
    };
    const { reposDeprecated } = this.state;
    this.setState({
      reposDeprecated: reposDeprecated.map(reportRepo => {
        if (reportRepo.name === repoName) {
          return { ...reportRepo, stats: reportStats };
        } else {
          return reportRepo;
        }
      })
    });
  };
}
