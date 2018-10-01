import React from "react";
import PropTypes from "prop-types";
import { Streamgraph } from "./base/stream";
import { TitleDiv, ChartDropdown } from "./utils";

const ALL_REPOS = "All repos";
const ALL_MEMBERS = "All members";
const ALL_TYPES = "All activity";

export class CommitChartContainer extends React.Component {
  static propTypes = {
    startDate: PropTypes.instanceOf(Date).isRequired,
    endDate: PropTypes.instanceOf(Date).isRequired,
    commitsData: PropTypes.array.isRequired,
    prData: PropTypes.array.isRequired
  };

  state = {
    selectedRepo: ALL_REPOS,
    selectedMember: ALL_MEMBERS,
    selectedType: ALL_TYPES
  };

  getPrevStart = () => {
    const copy = new Date(this.props.startDate);
    return new Date(copy.setDate(copy.getDate() - 7));
  };

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

  changeType = type => {
    this.setState({ selectedType: type });
  };

  showAllTypes = () => {
    this.setState({ selectedType: ALL_TYPES });
  };

  getFilteredByDate = (items, startTime, endTime) => {
    return items.filter(item => {
      const date = new Date(item.x);
      return date >= startTime && date <= endTime;
    });
  };

  getChartData = () => {
    const { commitsData, prData, startDate, endDate } = this.props;
    const prevEnd = new Date(startDate);
    const prevStart = this.getPrevStart();

    let allData = [];
    // Each entity has x (date), y, type, author, repo

    commitsData.forEach(repoCommits => {
      const { repo, commits } = repoCommits;
      commits.forEach(authorCommits => {
        const { author, commits } = authorCommits;
        commits.forEach(commitObject => {
          const { message, date } = commitObject;
          allData.push({
            author,
            repo,
            message,
            type: "commit",
            x: date,
            y: 1
          });
        });
      });
    });

    prData.forEach(repoPrItems => {
      const { repo, pulls } = repoPrItems;
      pulls.forEach(prItem => {
        const { comments } = prItem;
        comments.forEach(comment => {
          // TODO: comment does not have message
          const { author, date } = comment;
          allData.push({
            author,
            repo,
            type: "pr_comment",
            x: date,
            y: 1
          });
        });
      });
    });

    return {
      data: this.getFilteredByDate(allData, startDate, endDate),
      prevData: this.getFilteredByDate(allData, prevStart, prevEnd)
    };
  };

  filterBySelection = (data, excludeKey) => {
    const { selectedRepo, selectedMember, selectedType } = this.state;
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
      )
      .filter(
        item =>
          excludeKey === "type" ||
          selectedType === ALL_TYPES ||
          item.type === selectedType
      );
  };

  getDropdownOptions = (allData, key) => {
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

  render() {
    const { startDate, endDate } = this.props;
    const { selectedRepo, selectedMember, selectedType } = this.state;
    const { data, prevData } = this.getChartData();

    const types = this.getDropdownOptions(data, "type");
    const repos = this.getDropdownOptions(data, "repo");
    const members = this.getDropdownOptions(data, "author");

    const dataFiltered = this.filterBySelection(data);
    const prevFiltered = this.filterBySelection(prevData);
    const layeredData = dataFiltered.reduce((result, current) => {
      const { type } = current;
      result[type] = !!result[type] ? [...result[type], current] : [current];
      return result;
    }, {});

    return (
      <div>
        <TitleDiv>
          <div>
            <strong>Activity</strong> against previous week
          </div>
          <div>
            <ChartDropdown
              selected={selectedType}
              items={types}
              allText={ALL_TYPES}
              onSelect={this.changeType}
              onSelectAll={this.showAllTypes}
            />
            <ChartDropdown
              selected={selectedRepo}
              items={repos}
              allText={ALL_REPOS}
              onSelect={this.changeRepo}
              onSelectAll={this.showAllRepos}
            />
            <ChartDropdown
              selected={selectedMember}
              items={members}
              allText={ALL_MEMBERS}
              onSelect={this.changeMember}
              onSelectAll={this.showAllMembers}
            />
          </div>
        </TitleDiv>
        <Streamgraph
          data={Object.values(layeredData)}
          prevData={[prevFiltered]}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    );
  }
}
