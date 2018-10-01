import React from "react";
import { BarChart } from "./base/bar";
import { TitleDiv, ChartDropdown } from "./utils";

const ALL_REPOS = "All repos";
const ALL_MEMBERS = "All members";

export class WeeklyChartContainer extends React.Component {
  state = { selectedRepo: ALL_REPOS, selectedMember: ALL_MEMBERS };

  changeRepo = repo => {
    this.setState({ selectedRepo: repo });
  };

  showAllRepos = () => {
    this.setState({ selectedRepo: ALL_REPOS });
  };

  changeMember = member => {
    this.setState({ selectedMember: member });
  };

  showAllMembers = () => {
    this.setState({ selectedMember: ALL_MEMBERS });
  };

  getParsedData = () => {
    const { data } = this.props;
    let weekWiseData = {};

    data.forEach(repoCommits => {
      const { repo, commits } = repoCommits;
      commits.forEach(authorCommits => {
        const { author, values } = authorCommits;
        values.map(weekValues => {
          const { week, value } = weekValues;

          if (value > 0) {
            const thisValue = {
              author,
              repo,
              value
            };
            weekWiseData[week] =
              week in weekWiseData
                ? [...weekWiseData[week], thisValue]
                : [thisValue];
          }
        });
      });
    });

    return weekWiseData;
  };

  filterBySelection = (data, excludeKey) => {
    const { selectedRepo, selectedMember } = this.state;
    let result = {};

    Object.keys(data).forEach(week => {
      result[week] = data[week].filter(item => {
        const isAuthorAllowed =
          excludeKey === "author" ||
          selectedMember === ALL_MEMBERS ||
          item.author === selectedMember;
        const isRepoAllowed =
          excludeKey === "repo" ||
          selectedRepo === ALL_REPOS ||
          item.repo === selectedRepo;
        return isAuthorAllowed && isRepoAllowed;
      });
    });

    return result;
  };

  getDropdownOptions = (allData, keyName) => {
    let keyWiseSums = {};
    const filtered = this.filterBySelection(allData, keyName);

    Object.keys(filtered).forEach(week => {
      filtered[week].forEach(data => {
        const key = data[keyName];
        const value = data.value;
        keyWiseSums[key] =
          key in keyWiseSums ? keyWiseSums[key] + value : value;
      });
    });

    return Object.keys(keyWiseSums).map(key => ({
      text: key,
      value: keyWiseSums[key]
    }));
  };

  render() {
    const data = this.getParsedData();
    const { selectedRepo, selectedMember } = this.state;
    const repos = this.getDropdownOptions(data, "repo");
    const members = this.getDropdownOptions(data, "author");
    const filteredData = this.filterBySelection(data);
    const filtered = Object.keys(filteredData).map(week => ({
      week,
      value: filteredData[week].reduce((total, curr) => total + curr.value, 0)
    }));

    return (
      <div>
        <TitleDiv>
          <div>
            <strong>Commits</strong> week-on-week
          </div>
          <div>
            <ChartDropdown
              allText={ALL_REPOS}
              selected={selectedRepo}
              items={repos}
              onSelect={this.changeRepo}
              onSelectAll={this.showAllRepos}
            />
            <ChartDropdown
              allText={ALL_MEMBERS}
              selected={selectedMember}
              items={members}
              onSelect={this.changeMember}
              onSelectAll={this.showAllMembers}
            />
          </div>
        </TitleDiv>
        <BarChart data={filtered} />
      </div>
    );
  }
}
