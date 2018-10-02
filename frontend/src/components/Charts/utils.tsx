import * as React from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle
} from "reactstrap";

const HUMAN_READABLE_MODIFIERS = {
  commit: "Commits",
  pr_comment: "PR comments"
};

export const TitleDiv = ({ children }) => (
  <div className="d-flex justify-content-between align-items-baseline mt-3">
    {children}
  </div>
);

type ChartDropdownItem = {
  value: number;
  text: string;
};

type ChartDropdownProps = {
  items?: ChartDropdownItem[];
  selected?: string;
  allText?: string;
  onSelect?: (...args: any[]) => any;
  onSelectAll?: (...args: any[]) => any;
};

type ChartDropdownState = {
  isOpen: boolean;
};

export class ChartDropdown extends React.Component<
  ChartDropdownProps,
  ChartDropdownState
> {
  public state = {
    isOpen: false
  };

  public render() {
    const { items, onSelect, allText, onSelectAll } = this.props;
    const totalValue = this.getTotalValue();
    return (
      <Dropdown
        size="sm"
        isOpen={this.state.isOpen}
        toggle={this.toggle}
        style={{ display: "inline-block", margin: 5 }}
      >
        <DropdownToggle caret={true}>{this.getSelectedText()}</DropdownToggle>
        <DropdownMenu>
          {allText ? (
            <div>
              <DropdownItem onClick={onSelectAll}>
                {allText} ({totalValue})
              </DropdownItem>
              <DropdownItem divider={true} />
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

  private toggle = () => {
    this.setState(prevState => ({
      isOpen: !prevState.isOpen
    }));
  };

  private getTotalValue = () => {
    const { items } = this.props;
    return items.reduce((sum, current) => sum + current.value, 0);
  };

  private getSelectedText = () => {
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

  private getLabel = text => {
    return text in HUMAN_READABLE_MODIFIERS
      ? HUMAN_READABLE_MODIFIERS[text]
      : text;
  };
}
