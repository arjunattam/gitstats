import React from "react";
import * as d3 from "d3";
import { Container } from "reactstrap";
import {
  getReport,
  getRepoStats,
  getPRActivity,
  getCommits
} from "../../utils/api";
import { TitleLoader } from "./loaders";
import { Summary } from "./summary";
import { Members } from "./members";
import { Repos } from "./repos";
import { Pulls } from "./pulls";
import { EmailSender } from "./email";
import { CommitChartContainer, PRChartContainer } from "./charts";

const ReportTitle = ({ period, isLoading }) => {
  if (isLoading) {
    return <TitleLoader />;
  }

  const { next } = period;
  const n = new Date(next);
  const month = n.getMonth();
  const day = n.getDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  return (
    <p className="lead">
      Report for the week of {monthNames[month]} {day} - {day + 6}
    </p>
  );
};

export const ReportContainer = props => {
  const { reportJson, isLoading, prActivityData, commitsData, team } = props;
  const thisWeekStart = d3.utcSunday(new Date());
  const copy = new Date(thisWeekStart);
  const startDate = d3.utcSunday(new Date(copy.setDate(copy.getDate() - 7)));
  const dates = {
    startDate,
    endDate: thisWeekStart
  };

  return (
    <Container>
      <ReportTitle {...reportJson} isLoading={isLoading} />
      <Summary {...reportJson} isLoading={isLoading} />
      <CommitChartContainer
        {...dates}
        commitsData={commitsData}
        prData={prActivityData}
      />
      <Members {...reportJson} isLoading={isLoading} />
      <Pulls {...reportJson} isLoading={isLoading} />
      <PRChartContainer {...dates} data={prActivityData} />
      <Repos {...reportJson} isLoading={isLoading} />
      <EmailSender team={team} />
    </Container>
  );
};

class Report extends React.Component {
  state = {
    isLoading: true,
    reportJson: {},
    prActivityData: [],
    commitsData: []
  };

  update() {
    const { params } = this.props.match;
    const { name: team } = params;

    getReport(team).then(response => {
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

    getPRActivity(team).then(response => {
      const { message } = response;
      this.setState({
        prActivityData: message
      });
    });

    getCommits(team).then(response => {
      const { message } = response;
      this.setState({
        commitsData: message
      });
    });
  }

  updateRepo(repo) {
    const { params } = this.props.match;
    const { name: team } = params;

    getRepoStats(team, repo)
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
    const { params } = this.props.match;
    const { params: prev } = prevProps.match;

    if (prev && prev.name !== params.name) {
      this.setState({ reportJson: {}, isLoading: true });
      this.update();
    }
  }

  componentDidMount() {
    this.update();
  }

  render() {
    const { params } = this.props.match;
    const { name: team } = params;
    return <ReportContainer {...this.state} team={team} />;
  }
}

export default Report;
