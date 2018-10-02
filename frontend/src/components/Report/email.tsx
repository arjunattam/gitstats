import * as React from "react";
import { Button, Container, Form, FormGroup, Input, Label } from "reactstrap";
import { sendEmail } from "../../utils/api";
import { getUserProfile, isAuthenticated } from "../../utils/auth";

interface IEmailSenderState {
  emailInput: any | string;
  isLoading: boolean;
}

interface IEmailSenderProps {
  teamLogin: string;
  weekStart: string;
}

export class EmailSender extends React.Component<
  IEmailSenderProps,
  IEmailSenderState
> {
  public state = {
    emailInput: "",
    isLoading: false
  };

  public componentDidMount() {
    const { email } = getUserProfile();
    this.setState({ emailInput: email });
  }

  public render() {
    const { isLoading } = this.state;
    const isLogged = isAuthenticated();
    return isLogged ? (
      <Container className="my-5">
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
      </Container>
    ) : null;
  }

  private send = event => {
    event.preventDefault();
    const { emailInput } = this.state;
    const { teamLogin, weekStart } = this.props;
    this.setState({ isLoading: true });

    sendEmail(emailInput, teamLogin, weekStart).then(() => {
      this.setState({ isLoading: false });
    });
  };

  private updateInput = event => {
    this.setState({
      emailInput: event.target.value
    });
  };
}
