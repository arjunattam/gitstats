import React from "react";
import { connect } from "react-redux";
import {
  getReport,
  getRepoStats,
  getPRActivity,
  getCommits
} from "../../utils/api";
import { getWeekStart } from "../../utils/date";
import { Container } from "./container";
import { Header } from "./header";
import { EmailSender } from "./email";

export class Report extends React.Component {
  state = {
    weekStart: "",
    isLoading: true,
    reportJson: {
      period: {},
      owner: {},
      repos: []
    },
    prActivityData: [],
    commitsData: []
  };

  update() {
    const { owner: team } = this.props;
    const { weekStart } = this.state;

    getReport(team.login, weekStart).then(response => {
      const { repos } = response.message;
      const pendingRepos = repos.filter(repo => repo.stats.is_pending);
      pendingRepos.forEach(repo => {
        setTimeout(() => this.updateRepo(repo.name), 1000);
      });

      return this.setState({
        reportJson: response.message,
        isLoading: false
      });
    });

    getPRActivity(team.login, weekStart).then(response => {
      const { message } = response;
      this.setState({
        prActivityData: message
      });
    });

    getCommits(team.login, weekStart).then(response => {
      const { message } = response;
      this.setState({
        commitsData: message
      });
    });
  }

  updateRepo(repo) {
    const { owner: team } = this.props;
    const { weekStart } = this.state;

    getRepoStats(team.login, repo, weekStart)
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

  componentDidUpdate(prevProps, prevState) {
    const { owner: newOwner } = this.props;
    const { owner: prevOwner } = prevProps;

    if (newOwner.login !== prevOwner.login) {
      this.setState({ reportJson: {}, isLoading: true });
      this.update();
    }
  }

  componentDidMount() {
    this.setState({ weekStart: getWeekStart() }, () => this.update());
  }

  render() {
    const { owner: team } = this.props;
    const { weekStart } = this.state;
    return (
      <div className="py-4">
        <Header team={team} weekStart={weekStart} />
        <Container {...this.state} />
        <EmailSender team={team} weekStart={weekStart} />
      </div>
    );
  }
}

const ReportPageContainer = ({ match, data }) => {
  const { teams: storeTeams } = data;
  const { name: selectedLogin } = match.params;
  const filteredTeams = storeTeams.filter(team => team.login === selectedLogin);
  let owner = {
    login: selectedLogin
  };

  if (filteredTeams.length > 0) {
    // We have this team in store
    const selectedTeam = filteredTeams[0];
    owner = { ...owner, ...selectedTeam };
  }

  return <Report owner={owner} />;
};

function mapStateToProps(state) {
  const { data } = state;
  return { data };
}

export const ReportPage = connect(mapStateToProps)(ReportPageContainer);
