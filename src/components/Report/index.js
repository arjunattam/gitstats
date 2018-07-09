import React from "react";
import { Container } from "reactstrap";
import { getReport } from "../../utils/api";
import { Summary } from "./summary";
import { Members } from "./members";
import { Repos } from "./repos";
import { Pulls } from "./pulls";

const ReportTitle = ({ period }) => {
  const { next } = period;
  const p = new Date(next);
  const month = p.getMonth();
  const day = p.getDate();
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
      Report for the week of {monthNames[month]} {day}
    </p>
  );
};

class Report extends React.Component {
  state = { responseJson: {}, isLoading: true };

  update() {
    // TODO(arjun): add content loader https://github.com/danilowoz/react-content-loader
    const { params } = this.props.match;
    getReport(params.name)
      .then(response =>
        this.setState({ responseJson: response.message, isLoading: false })
      )
      .catch(error =>
        this.setState({
          responseJson: { status: error.toString() },
          isLoading: false
        })
      );
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
    const { responseJson } = this.state;
    return responseJson.period ? (
      <Container>
        <ReportTitle {...responseJson} />
        <Summary {...responseJson} />
        <Members {...responseJson} />
        <Pulls {...responseJson} />
        <Repos {...responseJson} />
      </Container>
    ) : null;
  }
}

export default Report;
