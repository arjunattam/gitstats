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
        <td colSpan="3">
          <TitleLoader />
        </td>
      </tr>
    ) : (
      <tr>
        <td>{values[0]}</td>
        <td>{values[1]}</td>
        <td>{values[2]}</td>
        <td>{values[3]}</td>
      </tr>
    );
  }
}

const THeader = ({ rowHeadings }) => {
  return (
    <thead className="thead-light">
      <tr>
        <th style={{ width: "32%" }}>{rowHeadings[0]}</th>
        <th style={{ width: "22%" }}>{rowHeadings[1]}</th>
        <th style={{ width: "22%" }}>{rowHeadings[2]}</th>
        <th style={{ width: "22%" }}>{rowHeadings[3]}</th>
      </tr>
    </thead>
  );
};

const TBody = ({ rowData }) => (
  <tbody>{rowData.map(data => <TableRow key={data.key} {...data} />)}</tbody>
);

const ExpandButton = ({ onClick, text }) => (
  <div className="mb-3" style={{ textAlign: "center" }}>
    <Button outline color="secondary" size="sm" onClick={onClick}>
      {text}
    </Button>
  </div>
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
        <table className="table table-hover">
          <THeader rowHeadings={rowHeadings} />
        </table>
        <BodyLoader />
      </div>
    ) : (
      <div>
        <table className="table table-hover">
          <THeader rowHeadings={rowHeadings} />
          <TBody rowData={this.getRowData()} />
        </table>
        {this.renderExpandButton()}
      </div>
    );
  }
}
