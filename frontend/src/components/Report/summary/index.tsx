import * as React from "react";
import { Container as BootstrapContainer } from "reactstrap";
import { CommitChartContainer } from "../../Charts/commits";
import { ChartDropdown } from "../../Charts/utils";
import { SummaryRow } from "./summary";

const ALL_REPOS = "All repos";
const ALL_MEMBERS = "All members";

interface ISummaryContainerProps {
  repos: IRepository[];
  period: IPeriod;
  isLoading: boolean;
  prActivityData: IPullRequestData[];
  commitsData: ICommits[];
  chartBounds: { startDate: Date; endDate: Date };
}

interface ISummaryContainerState {
  selectedRepo: string;
  selectedMember: string;
}

export class SummaryContainer extends React.Component<
  ISummaryContainerProps,
  ISummaryContainerState
> {
  public state = {
    selectedMember: ALL_MEMBERS,
    selectedRepo: ALL_REPOS
  };

  public render() {
    const {
      repos,
      period,
      isLoading,
      prActivityData,
      commitsData,
      chartBounds
    } = this.props;
    const { selectedRepo, selectedMember } = this.state;
    const repoItems = this.getDropdownOptions(repos, "name");
    const memberItems = this.getDropdownOptions(repos, "name");

    return (
      <div className="my-4 py-4 border-top border-bottom bg-light">
        <BootstrapContainer>
          <FilteringRow
            repos={repoItems}
            selectedRepo={selectedRepo}
            changeRepo={this.changeRepo}
            showAllRepos={this.showAllRepos}
            members={memberItems}
            selectedMember={selectedMember}
            changeMember={this.changeMember}
            showAllMembers={this.showAllMembers}
          />
          <SummaryRow
            repos={repos}
            period={period}
            prData={prActivityData}
            isLoading={isLoading}
          />
          <CommitChartContainer
            {...chartBounds}
            commitsData={commitsData}
            prData={prActivityData}
            selectedMember={selectedMember}
            selectedRepo={selectedRepo}
          />
        </BootstrapContainer>
      </div>
    );
  }

  private filterBySelection = (data, excludeKey?) => {
    const { selectedRepo, selectedMember } = this.state;
    return data
      .filter(
        item =>
          excludeKey === "repo" ||
          selectedRepo === ALL_REPOS ||
          item.repo === selectedRepo
      )
      .filter(
        item =>
          excludeKey === "author" ||
          selectedMember === ALL_MEMBERS ||
          item.author === selectedMember
      );
  };

  private getDropdownOptions = (allData, key) => {
    const filtered = this.filterBySelection(allData, key);
    const keyWiseSums = filtered.reduce((total, current) => {
      const value = current[key];
      total[value] = 1 + (total[value] ? total[value] : 0);
      return total;
    }, {});

    return Object.keys(keyWiseSums).map(value => ({
      text: value,
      value: keyWiseSums[value]
    }));
  };

  private changeRepo = repo => {
    this.setState({ selectedRepo: repo });
  };

  private showAllRepos = () => {
    this.setState({ selectedRepo: ALL_REPOS });
  };

  private changeMember = member => {
    this.setState({ selectedMember: member });
  };

  private showAllMembers = () => {
    this.setState({ selectedMember: ALL_MEMBERS });
  };
}

const FilteringRow = ({
  selectedRepo,
  selectedMember,
  repos,
  members,
  changeRepo,
  showAllRepos,
  changeMember,
  showAllMembers
}) => {
  return (
    <div className="d-flex justify-content-end align-items-center my-2">
      <div className="small text-muted text-uppercase">Filters</div>
      <ChartDropdown
        selected={selectedRepo}
        items={repos}
        allText={ALL_REPOS}
        onSelect={changeRepo}
        onSelectAll={showAllRepos}
      />
      <ChartDropdown
        selected={selectedMember}
        items={members}
        allText={ALL_MEMBERS}
        onSelect={changeMember}
        onSelectAll={showAllMembers}
      />
    </div>
  );
};
