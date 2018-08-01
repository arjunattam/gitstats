import React from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import { Streamgraph, PRActivity } from "../Charts";

const ALL_REPOS = "All repos";
const ALL_MEMBERS = "All members";
const ALL_TYPES = "All activity";

const HUMAN_READABLE_MODIFIERS = {
  commit: "Commits",
  pr_comment: "PR comments"
};

class MyDropdown extends React.Component {
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

const TitleDiv = ({ children }) => (
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

export class CommitChartContainer extends React.Component {
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
    let allData = []; // Each entity has x (date), y, type, author, repo

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
            <MyDropdown
              selected={selectedType}
              items={types}
              allText={ALL_TYPES}
              onSelect={this.changeType}
              onSelectAll={this.showAllTypes}
            />
            <MyDropdown
              selected={selectedRepo}
              items={repos}
              allText={ALL_REPOS}
              onSelect={this.changeRepo}
              onSelectAll={this.showAllRepos}
            />
            <MyDropdown
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

export class PRChartContainer extends React.Component {
  state = { selectedRepo: "" };

  getDefaultSelected = () => {
    const { data } = this.props;

    if (data) {
      let selectedRepo = "";
      const filtered = data
        .map(({ repo, pulls }) => ({
          text: repo,
          value: this.filteredPulls(pulls).length
        }))
        .filter(item => item.value > 0);

      if (filtered.length) {
        selectedRepo = filtered[0].text;
      }

      return selectedRepo;
    }
  };

  changeRepo = repo => {
    this.setState({ selectedRepo: repo });
  };

  filteredPulls = pulls => {
    const { endDate, startDate } = this.props;
    return pulls.filter(
      pr =>
        new Date(pr.created_at) < endDate &&
        (pr.closed_at === null || new Date(pr.closed_at) > startDate)
    );
  };

  render() {
    const { data } = this.props;
    const { selectedRepo: stateSelected } = this.state;
    const selectedRepo = stateSelected || this.getDefaultSelected();

    const repos = data.map(({ repo, pulls }) => ({
      text: repo,
      value: this.filteredPulls(pulls).length
    }));
    const selectedData = data.filter(item => item.repo === selectedRepo);
    let pullsData = [];

    if (selectedData.length > 0) {
      pullsData = this.filteredPulls(selectedData[0].pulls);
    }

    return (
      <div>
        <TitleDiv>
          <div>
            <strong>PR activity</strong> this week
          </div>
          <div>
            <MyDropdown
              selected={selectedRepo}
              items={repos}
              onSelect={this.changeRepo}
            />
          </div>
        </TitleDiv>
        <PRActivity {...this.props} data={pullsData} />
      </div>
    );
  }
}
