import React from "react";
import * as d3 from "d3";
import { Container } from "reactstrap";
import { getReport, getRepoStats, getPRActivity } from "../../utils/api";
import { TitleLoader } from "./loaders";
import { Summary } from "./summary";
import { Members } from "./members";
import { Repos } from "./repos";
import { Pulls } from "./pulls";
import { CommitChartContainer } from "./charts";

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

class PRChartContainer extends React.Component {
  state = { prData: [] };

  componentDidMount() {
    // getPRActivity("getsentry").then(response => {
    //   this.setState({ prData: response.message });
    // });
  }

  render() {
    // return <PRActivity data={this.state.prData} />;
    return null;
  }
}

export const ReportContainer = props => {
  const { params } = props;
  const thisWeekStart = d3.utcSunday(new Date());
  const copy = new Date(thisWeekStart);
  const startDate = d3.utcSunday(new Date(copy.setDate(copy.getDate() - 7)));
  const chartProps = {
    username: params ? params.name : "getsentry",
    startDate,
    endDate: thisWeekStart
  };

  return (
    <Container>
      <ReportTitle {...props} />
      <Summary {...props} />
      <CommitChartContainer {...chartProps} />
      <Members {...props} />
      <Pulls {...props} />
      <PRChartContainer />
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
    const { params } = this.props.match;
    const { responseJson, isLoading } = this.state;
    return (
      <ReportContainer
        {...responseJson}
        params={params}
        isLoading={isLoading}
      />
    );
  }
}

export default Report;
