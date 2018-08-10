import React from "react";
import PropTypes from "prop-types";
import { Button } from "reactstrap";
import { BodyLoader, TitleLoader } from "./loaders";

class TableRow extends React.Component {
  static propTypes = {
    values: PropTypes.array,
    isLoading: PropTypes.bool
  };

  render() {
    const { values, isLoading } = this.props;
    // assumes that the first column is available
    return isLoading ? (
      <tr>
        <td>{values[0]}</td>
        <td colSpan="2">
          <TitleLoader />
        </td>
      </tr>
    ) : (
      <tr>
        <td>{values[0]}</td>
        <td>{values[1]}</td>
        <td>{values[2]}</td>
      </tr>
    );
  }
}

const THeader = ({ rowHeadings }) => {
  return (
    <thead className="thead-light">
      <tr>
        <th style={{ width: "33%" }}>{rowHeadings[0]}</th>
        <th style={{ width: "33%" }}>{rowHeadings[1]}</th>
        <th style={{ width: "33%" }}>{rowHeadings[2]}</th>
      </tr>
    </thead>
  );
};

const TBody = ({ rowData }) => (
  <tbody>
    {rowData.map(data => (
      <TableRow key={data.key} {...data} />
    ))}
  </tbody>
);

const ExpandButton = ({ onClick, text }) => (
  <div className="mb-3" style={{ textAlign: "center" }}>
    <Button outline color="secondary" size="sm" onClick={onClick}>
      {text}
    </Button>
  </div>
);

const BaseTable = ({ children }) => (
  <table className="table" style={{ margin: "40px 0 0" }}>
    {children}
  </table>
);

export default class Table extends React.Component {
  static propTypes = {
    rowHeadings: PropTypes.arrayOf(PropTypes.string),
    rowData: PropTypes.arrayOf(PropTypes.object),
    rowLimit: PropTypes.number,
    isLoading: PropTypes.bool
  };

  state = {
    isExpanded: false
  };

  toggleExpand = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  };

  getRowData = () => {
    const { isExpanded } = this.state;
    const { rowData, rowLimit } = this.props;
    return isExpanded ? rowData : rowData.slice(0, rowLimit);
  };

  renderExpandButton = () => {
    const { rowData, rowLimit } = this.props;
    const isExpandable = rowData.length > rowLimit;
    const text = this.state.isExpanded ? "Show less" : "Show all";
    return isExpandable ? (
      <ExpandButton text={text} onClick={this.toggleExpand} />
    ) : null;
  };

  render() {
    const { rowHeadings, isLoading } = this.props;
    return isLoading ? (
      <div>
        <BaseTable>
          <THeader rowHeadings={rowHeadings} />
        </BaseTable>
        <BodyLoader />
      </div>
    ) : (
      <div>
        <BaseTable>
          <THeader rowHeadings={rowHeadings} />
          <TBody rowData={this.getRowData()} />
        </BaseTable>
        {this.renderExpandButton()}
      </div>
    );
  }
}
