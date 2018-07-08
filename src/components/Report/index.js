import React from "react";
import JSONPretty from "react-json-pretty";
import { Container } from "reactstrap";
import { getReport } from "../../utils/api";

class Report extends React.Component {
  state = { responseJson: { status: "Loading" } };

  componentDidMount() {
    getReport("karigari", "mercury-extension")
      .then(response => this.setState({ responseJson: response.message }))
      .catch(error =>
        this.setState({ responseJson: { status: error.toString() } })
      );
  }

  render() {
    // TODO(arjun): yarn remove react-json-pretty when we have our own UI
    return (
      <Container>
        <JSONPretty id="json-pretty" json={this.state.responseJson} />
      </Container>
    );
  }
}

export default Report;
