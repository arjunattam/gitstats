import React from "react";
import { Button, Form, FormGroup, Label, Input } from "reactstrap";
import { Auth } from "../../utils/auth";
import { sendEmail } from "../../utils/api";

export class EmailSender extends React.Component {
  state = {
    isLoading: false,
    emailInput: ""
  };

  componentDidMount() {
    const auth = new Auth();
    const { email } = auth.getUserProfile();
    this.setState({ emailInput: email });
  }

  send = event => {
    event.preventDefault();
    const { emailInput } = this.state;
    const { team } = this.props;
    this.setState({ isLoading: true });

    sendEmail(emailInput, team).then(() => {
      this.setState({ isLoading: false });
    });
  };

  updateInput = event => {
    this.setState({
      emailInput: event.target.value
    });
  };

  render() {
    const auth = new Auth();
    const { isLoading } = this.state;
    const isLogged = auth.isAuthenticated();

    return isLogged ? (
      <div style={{ marginTop: 60 }}>
        <h5>Send this report in an email</h5>

        <Form inline onSubmit={this.send}>
          <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
            <Label for="email" className="mr-sm-2">
              Email
            </Label>
            <Input
              value={this.state.emailInput}
              onChange={evt => this.updateInput(evt)}
              type="email"
              name="email"
              id="email"
            />
          </FormGroup>

          <Button>{isLoading ? "Sending..." : "Send email"}</Button>
        </Form>
      </div>
    ) : null;
  }
}
