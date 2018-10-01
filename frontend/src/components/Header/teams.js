import React from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import { Link } from "react-router-dom";

export class TeamsDropDown extends React.Component {
  static propTypes = {
    teams: PropTypes.arrayOf(PropTypes.object).isRequired
  };

  state = {
    isOpen: false
  };

  toggle = () => {
    this.setState(prevState => ({
      isOpen: !prevState.isOpen
    }));
  };

  render() {
    const { teams } = this.props;
    return (
      <Dropdown
        style={{ display: "inline" }}
        className="mx-3"
        isOpen={this.state.isOpen}
        toggle={() => this.toggle()}
      >
        <DropdownToggle caret>Your teams</DropdownToggle>
        <DropdownMenu>
          {teams.map(team => {
            return (
              <Link to={`/report/${team.login}`} key={team.login}>
                <DropdownItem>{team.name}</DropdownItem>
              </Link>
            );
          })}

          <DropdownItem divider />
          <Link to={`/setup`}>
            <DropdownItem>Setup teams</DropdownItem>
          </Link>
        </DropdownMenu>
      </Dropdown>
    );
  }
}
