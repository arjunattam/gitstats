import * as React from "react";
import { Button } from "reactstrap";
import { BodyLoader, TitleLoader } from "./loaders";

interface ITableRowProps {
  values: any[];
  isLoading: boolean;
}

class TableRow extends React.Component<ITableRowProps, {}> {
  public render() {
    const { values, isLoading } = this.props;
    // assumes that the first column is available
    return isLoading ? (
      <tr>
        <td>{values[0]}</td>
        <td colSpan={3}>
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
        <th style={{ width: "31%" }}>{rowHeadings[0]}</th>
        <th style={{ width: "23%" }}>{rowHeadings[1]}</th>
        <th style={{ width: "23%" }}>{rowHeadings[2]}</th>
        <th style={{ width: "23%" }}>{rowHeadings[3]}</th>
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
  <div className="mb-3 text-center">
    <Button outline={true} color="secondary" size="sm" onClick={onClick}>
      {text}
    </Button>
  </div>
);

interface ITableProps {
  isLoading: boolean;
  rowLimit: number;
  rowHeadings: string[];
  rowData: any[];
}

interface ITableState {
  isExpanded: boolean;
}

// tslint:disable-next-line:max-classes-per-file
export default class Table extends React.Component<ITableProps, ITableState> {
  public state = {
    isExpanded: false
  };

  public render() {
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

  private toggleExpand = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  };

  private getRowData = () => {
    const { isExpanded } = this.state;
    const { rowData, rowLimit } = this.props;
    return isExpanded ? rowData : rowData.slice(0, rowLimit);
  };

  private renderExpandButton = () => {
    const { rowData, rowLimit } = this.props;
    const length = rowData.length;
    const more = length - rowLimit;
    const isExpandable = more > 0;
    const text = this.state.isExpanded
      ? "Show less"
      : `Show all (${more} more)`;

    return isExpandable ? (
      <ExpandButton text={text} onClick={this.toggleExpand} />
    ) : null;
  };
}

const BaseTable = ({ children }) => (
  <table className="table" style={{ margin: "40px 0 0" }}>
    {children}
  </table>
);
