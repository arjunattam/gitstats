import * as React from "react";
import {
  getCommits,
  getPRActivity,
  getReport,
  getRepoStats
} from "../../utils/api";
import { getPeriod, getWeekStart } from "../../utils/date";
import { ReportContainer } from "./container";
import { EmailContainer } from "./email";
import { Header } from "./header";

interface IReportProps {
  teamLogin: string;
  team?: ITeam;
}

interface IReportState {
  weekStart: string;
  prActivityData: IPullRequestData[];
  commitsData: ICommits[];
  reportJson: IReportJson;
  isLoading: boolean;
}

export class Report extends React.Component<IReportProps, IReportState> {
  public state = {
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
    const { team, teamLogin } = this.props;
    const { weekStart } = this.state;
    const period = getPeriod(weekStart);

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

    getReport(teamLogin, weekStart).then(response => {
      const { repos } = response.message;
      const pendingRepos = repos.filter(repo => repo.stats.is_pending);
      pendingRepos.forEach(repo => {
        setTimeout(() => this.updateRepo(repo.name), 1000);
      });
      return this.setState({
        isLoading: false,
        reportJson: response.message
      });
    });

    getPRActivity(teamLogin, weekStart).then(response => {
      const { message } = response;
      this.setState({
        prActivityData: message
      });
    });

    getCommits(teamLogin, weekStart).then(response => {
      const { message } = response;
      this.setState({
        commitsData: message
      });
    });
  }

  private updateRepo(repo) {
    const { teamLogin } = this.props;
    const { weekStart } = this.state;

    getRepoStats(teamLogin, repo, weekStart)
      .then(response => {
        const { stats } = response.message;
        const { is_pending } = stats;

        if (!is_pending) {
          const { repos } = this.state.reportJson;
          const newRepos = repos.map(r => {
            if (r.name === repo) {
              return { ...r, stats };
            } else {
              return r;
            }
          });

          this.setState({
            reportJson: {
              ...this.state.reportJson,
              repos: newRepos
            }
          });
        } else {
          setTimeout(() => this.updateRepo(repo), 1000);
        }
      })
      .catch(error => {
        console.log("update repo errored. will try again", error);
        setTimeout(() => this.updateRepo(repo), 1000);
      });
  }
}
