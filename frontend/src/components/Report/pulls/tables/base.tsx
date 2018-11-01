import { IMember, IPeriod, IPullsAPIResult, IRepo } from "gitstats-shared";
import * as React from "react";
import { MemberName } from "src/components/Common";
import { InlineSelect } from "../../common/filters";

interface IPullsTableProps {
  repos: IRepo[];
  pulls: IPullsAPIResult[];
  period: IPeriod;
  members: IMember[];
}

interface IPullsTableState {
  selectedRepo: string;
}

const TableRow = ({ member, values }) => {
  return (
    <tr>
      <td>
        <MemberName {...member} />
      </td>
      {values.map((value, index) => (
        <td key={`${member.login}-${index}`}>{value}</td>
      ))}
    </tr>
  );
};

const RepoFilter = ({ repos, changeRepo }) => {
  const repoItems = repos.map(repo => ({ value: repo.name, label: repo.name }));
  return (
    <InlineSelect
      width={250}
      placeholder={"Filter by Repo"}
      isClearable={true}
      onChange={changeRepo}
      options={repoItems}
    />
  );
};

export abstract class BasePRMetricsTable extends React.Component<
  IPullsTableProps,
  IPullsTableState
> {
  public state: IPullsTableState = {
    selectedRepo: undefined
  };

  public onRepoChanged = selectedRepo => {
    if (!!selectedRepo) {
      this.setState({ selectedRepo: selectedRepo.value });
    } else {
      this.setState({ selectedRepo: undefined });
    }
  };

  public render() {
    const { selectedRepo } = this.state;
    const values = this.getValues(selectedRepo);
    const totalValues = this.getTotal(selectedRepo);
    return (
      <div className="my-4">
        {this.renderTitle()}
        <table className="table">
          <thead>{this.getTableHeadRow()}</thead>
          <tbody>
            {[totalValues, ...values].map(row => {
              return <TableRow {...row} key={row.member.login} />;
            })}
          </tbody>
        </table>
      </div>
    );
  }

  protected abstract getValues(repo: string);
  protected abstract getTotal(repo: string);
  protected abstract getTableHeadRow();
  protected abstract getTableTitle();

  private renderTitle() {
    return (
      <div className="d-flex justify-content-between align-items-center flex-wrap my-2">
        <div>
          <h4>{this.getTableTitle()}</h4>
        </div>
        <div>
          <RepoFilter
            repos={this.props.repos}
            changeRepo={this.onRepoChanged}
          />
        </div>
      </div>
    );
  }
}
