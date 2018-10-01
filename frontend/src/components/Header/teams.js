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
    teamNames: PropTypes.arrayOf(PropTypes.string).isRequired
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
    const { teamNames } = this.props;
    return (
      <Dropdown
        style={{ display: "inline" }}
        className="mx-3"
        isOpen={this.state.isOpen}
        toggle={() => this.toggle()}
      >
        <DropdownToggle caret>Your teams</DropdownToggle>
        <DropdownMenu>
          {teamNames.map(team => {
            return (
              <Link to={`/report/${team}`}>
                <DropdownItem key={team}>{team}</DropdownItem>
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
