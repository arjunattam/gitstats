import React from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";

const HUMAN_READABLE_MODIFIERS = {
  commit: "Commits",
  pr_comment: "PR comments"
};

export const TitleDiv = ({ children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginTop: "40px"
    }}
  >
    {children}
  </div>
);

export class ChartDropdown extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(PropTypes.object),
    selected: PropTypes.string,
    allText: PropTypes.string,
    onSelect: PropTypes.func,
    onSelectAll: PropTypes.func
  };

  state = {
    isOpen: false
  };

  toggle = () => {
    this.setState(prevState => ({
      isOpen: !prevState.isOpen
    }));
  };

  getTotalValue = () => {
    const { items } = this.props;
    return items.reduce((sum, current) => sum + current.value, 0);
  };

  getSelectedText = () => {
    const { selected, items, allText } = this.props;
    let value;

    if (selected === allText) {
      value = this.getTotalValue();
    } else {
      const filtered = items.filter(i => i.text === selected);
      value = filtered.length > 0 ? filtered[0].value : 0;
    }

    return `${this.getLabel(selected)} (${value})`;
  };

  getLabel = text => {
    return text in HUMAN_READABLE_MODIFIERS
      ? HUMAN_READABLE_MODIFIERS[text]
      : text;
  };

  render() {
    const { items, onSelect, allText, onSelectAll } = this.props;
    const totalValue = this.getTotalValue();
    return (
      <Dropdown
        size="sm"
        isOpen={this.state.isOpen}
        toggle={this.toggle}
        style={{ display: "inline-block", margin: 5 }}
      >
        <DropdownToggle caret>{this.getSelectedText()}</DropdownToggle>
        <DropdownMenu>
          {allText ? (
            <div>
              <DropdownItem onClick={() => onSelectAll()}>
                {allText} ({totalValue})
              </DropdownItem>
              <DropdownItem divider />
            </div>
          ) : null}

          {items.sort((a, b) => b.value - a.value).map(item => {
            const { text, value } = item;
            return (
              <DropdownItem key={text} onClick={() => onSelect(text)}>
                {this.getLabel(text)} ({value})
              </DropdownItem>
            );
          })}
        </DropdownMenu>
      </Dropdown>
    );
  }
}
