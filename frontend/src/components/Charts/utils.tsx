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

interface IChartDropdownItem {
  value: number;
  text: string;
}

interface IChartDropdownProps {
  items?: IChartDropdownItem[];
  selected?: string;
  allText?: string;
  onSelect?: (text: string) => any;
  onSelectAll?: () => any;
}

interface IChartDropdownState {
  isOpen: boolean;
}

export class ChartDropdown extends React.Component<
  IChartDropdownProps,
  IChartDropdownState
> {
  public state = {
    isOpen: false
  };

  public render() {
    const { items, onSelect, allText, onSelectAll } = this.props;
    const { isOpen } = this.state;
    const totalValue = this.getTotalValue();
    return (
      <Dropdown
        className="d-inline-block mx-2"
        size="sm"
        isOpen={isOpen}
        toggle={this.toggle}
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

// tslint:disable-next-line:max-classes-per-file
export class DropdownWithoutValues extends React.Component<
  IChartDropdownProps,
  IChartDropdownState
> {
  public state = {
    isOpen: false
  };

  public render() {
    const { items, onSelect, allText, onSelectAll } = this.props;
    const { isOpen } = this.state;

    return (
      <Dropdown
        className="d-inline-block mx-2"
        size="sm"
        isOpen={isOpen}
        toggle={this.toggle}
      >
        <DropdownToggle caret={true}>{this.getSelectedText()}</DropdownToggle>
        <DropdownMenu>
          {allText ? (
            <div>
              <DropdownItem onClick={onSelectAll}>{allText}</DropdownItem>
              <DropdownItem divider={true} />
            </div>
          ) : null}

          {items.map(item => {
            const { text } = item;
            return (
              <DropdownItem key={text} onClick={() => onSelect(text)}>
                {this.getLabel(text)}
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

  private getSelectedText = () => {
    const { selected } = this.props;
    return this.getLabel(selected);
  };

  private getLabel = text => {
    return text in HUMAN_READABLE_MODIFIERS
      ? HUMAN_READABLE_MODIFIERS[text]
      : text;
  };
}
