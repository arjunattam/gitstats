import React from "react";
import { Container } from "reactstrap";
import {
  getReport,
  getRepoStats,
  getCommits,
  getPRActivity
} from "../../utils/api";
import { TitleLoader } from "./loaders";
import { Summary } from "./summary";
import { Members } from "./members";
import { Repos } from "./repos";
import { Pulls } from "./pulls";
import { Streamgraph, PRActivity } from "../Charts";

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
      Report for the week of {monthNames[month]} {day}-{day + 6}
    </p>
  );
};

class ChartContainer extends React.Component {
  state = { commitsData: [], prData: [] };

  componentDidMount() {
    getCommits("docon2015", "docon_python").then(response => {
      this.setState({ commitsData: response });
    });

    const promises = [
      getPRActivity("getsentry", "sentry", "9078"),
      getPRActivity("getsentry", "sentry", "9087"),
      getPRActivity("getsentry", "sentry", "9057"),
      getPRActivity("getsentry", "sentry", "9058")
    ];

    Promise.all(promises).then(responses => {
      console.log("api response", responses);
      this.setState({ prData: responses.map(r => r.message) });
    });
  }

  render() {
    // return <Streamgraph data={this.state.commitsData} />;
    return <PRActivity data={this.state.prData} />;
  }
}

export const ReportContainer = props => {
  return (
    <Container>
      <ReportTitle {...props} />
      <Summary {...props} />
      <Members {...props} />
      <Pulls {...props} />
      <ChartContainer />
      <Repos {...props} />
    </Container>
  );
};

class Report extends React.Component {
  state = { responseJson: {}, isLoading: true };

  update() {
    const { params } = this.props.match;
    getReport(params.name).then(response => {
      const { repos } = response.message;
      const pendingRepos = repos.filter(repo => repo.stats.is_pending);
      pendingRepos.forEach(repo => {
        setTimeout(() => this.updateRepo(repo.name), 1000);
      });

      return this.setState({
        responseJson: response.message,
        isLoading: false
      });
    });
  }

  updateRepo(repo) {
    const { params } = this.props.match;
    const { name: username } = params;
    getRepoStats(username, repo)
      .then(response => {
        const { stats } = response.message;
        const { is_pending } = stats;

        if (!is_pending) {
          const { repos } = this.state.responseJson;
          const newRepos = repos.map(r => {
            if (r.name === repo) {
              return { ...r, stats };
            } else {
              return r;
            }
          });
          this.setState({
            responseJson: {
              ...this.state.responseJson,
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
      this.setState({ responseJson: {}, isLoading: true });
      this.update();
    }
  }

  componentDidMount() {
    this.update();
  }

  render() {
    const { responseJson, isLoading } = this.state;
    return <ReportContainer {...responseJson} isLoading={isLoading} />;
  }
}

export default Report;
