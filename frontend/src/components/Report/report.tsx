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
}

export class Report extends React.Component<IReportProps, IReportState> {
  public state: IReportState = {
    isLoading: true,
    members: [],
    period: undefined,
    pulls: [],
    repos: [],
    commits: []
  };

  public componentDidUpdate(prevProps: IReportProps, prevState) {
    const { teamLogin: newOwner } = this.props;
    const { teamLogin: prevOwner } = prevProps;

    if (newOwner !== prevOwner) {
      this.setState({
        isLoading: true,
        members: [],
        repos: [],
        pulls: [],
        commits: []
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
      this.setState({
        isLoading: false,
        members,
        repos,
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
      const { is_pending } = response;
      this.setState({
        commits: [...commits, response]
      });

      if (is_pending) {
        this.handlePendingResponse(repoName);
      }
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

  private handlePendingResponse = (repoName: string) => {
    // Wait for Github background job; fire request in 2 seconds
    // TODO: add exponential backoff
    const { teamLogin } = this.props;
    const weekStart = this.getWeekStart();

    setTimeout(() => {
      getCommits(teamLogin, repoName, weekStart).then(result => {
        const { commits } = this.state;
        const { is_pending } = result;
        this.setState({
          commits: [...commits, result]
        });

        if (is_pending) {
          this.handlePendingResponse(repoName);
        }
      });
    }, 2000);
  };
}
