import * as React from "react";
import { Button, Form, Input } from "reactstrap";
import { sendEmail } from "../../../utils/api";

interface IEmailSenderState {
  emailInput: string;
  isLoading: boolean;
}

interface IEmailSenderProps {
  defaultEmail: string;
  teamLogin: string;
  weekStart: string;
}

export class EmailForm extends React.Component<
  IEmailSenderProps,
  IEmailSenderState
> {
  public state = {
    emailInput: "",
    isLoading: false
  };

  public componentDidMount() {
    const { defaultEmail } = this.props;
    this.setState({ emailInput: defaultEmail });
  }

  public render() {
    const { isLoading } = this.state;

    const buttonText = isLoading ? "Sending..." : "Send sample email";
    return (
      <Form inline={true} onSubmit={this.send} className="my-3">
        <Input
          value={this.state.emailInput}
          onChange={this.updateInput}
          placeholder="Your email"
          type="text"
        />
        <Button className="mx-2">{buttonText}</Button>
      </Form>
    );
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
