import React from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import { getCommits } from "../../utils/api";
import { Streamgraph } from "../Charts";

const ALL_REPOS = "All repos";
const ALL_MEMBERS = "All members";

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

  render() {
    const { selected, items, onSelect, allText, onSelectAll } = this.props;
    const totalValue = items.reduce((sum, current) => sum + current.value, 0);
    return (
      <Dropdown
        size="sm"
        isOpen={this.state.isOpen}
        toggle={this.toggle}
        style={{ display: "inline-block", margin: 5 }}
      >
        <DropdownToggle caret>{selected}</DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={() => onSelectAll()}>
            {allText} ({totalValue})
          </DropdownItem>
          <DropdownItem divider />
          {items
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .map(item => (
              <DropdownItem key={item.text} onClick={() => onSelect(item.text)}>
                {item.text} ({item.value})
              </DropdownItem>
            ))}
        </DropdownMenu>
      </Dropdown>
    );
  }
}

export class CommitChartContainer extends React.Component {
  state = {
    response: [],
    selectedRepo: ALL_REPOS,
    selectedMember: ALL_MEMBERS,
    commitsData: [],
    prevData: []
  };

  componentDidMount() {
    const { username } = this.props;
    getCommits(username).then(response => {
      const { message } = response;
      this.setState(
        {
          response: message
        },
        () => this.setChartData()
      );
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const hasChangedRepo = prevState.selectedRepo !== this.state.selectedRepo;
    const hasChangedMember =
      prevState.selectedMember !== this.state.selectedMember;
    if (hasChangedMember || hasChangedRepo) {
      this.setChartData();
    }
  }

  getPrevStart = () => {
    const copy = new Date(this.props.startDate);
    return new Date(copy.setDate(copy.getDate() - 7));
  };

  setChartData = () => {
    const { response, selectedRepo, selectedMember } = this.state;
    const { startDate, endDate } = this.props;
    const prevEnd = new Date(startDate);
    const prevStart = this.getPrevStart();
    let repoCommits = [];

    if (selectedRepo === ALL_REPOS) {
      let authorWiseCommits = [];
      response.forEach(repoItem => {
        repoItem.commits.forEach(authorCommits => {
          const { author, commits } = authorCommits;
          if (author in authorWiseCommits) {
            authorWiseCommits[author] = [
              ...authorWiseCommits[author],
              ...commits
            ];
          } else {
            authorWiseCommits[author] = [...commits];
          }
        });
      });

      Object.keys(authorWiseCommits).forEach(author => {
        repoCommits.push({ author, commits: authorWiseCommits[author] });
      });
    } else {
      repoCommits = response.filter(item => item.repo === selectedRepo)[0]
        .commits;
    }

    let result = [];
    let prevResult = [];

    repoCommits.forEach(({ author, commits }) => {
      const isSelected =
        selectedMember === ALL_MEMBERS || selectedMember === author;

      if (isSelected) {
        // We are merging the authors here, instead of sending multiple layers
        result = [
          ...result,
          ...commits
            .filter(commit => {
              const commitDate = new Date(commit.date);
              return commitDate >= startDate && commitDate <= endDate;
            })
            .map(commit => ({ x: commit.date, y: 1 }))
        ];

        prevResult = [
          ...prevResult,
          ...commits
            .filter(commit => {
              const commitDate = new Date(commit.date);
              return commitDate >= prevStart && commitDate <= prevEnd;
            })
            .map(commit => ({ x: commit.date, y: 1 }))
        ];
      }
    });
    this.setState({ commitsData: [result], prevData: [prevResult] });
  };

  changeRepo = repo => {
    this.setState({
      selectedRepo: repo
    });
  };

  showAllRepos = () => {
    this.setState({
      selectedRepo: ALL_REPOS
    });
  };

  changeMember = member => {
    this.setState({
      selectedMember: member
    });
  };

  showAllMembers = () => {
    this.setState({
      selectedMember: ALL_MEMBERS
    });
  };

  render() {
    const { startDate, endDate } = this.props;
    const {
      commitsData,
      selectedRepo,
      selectedMember,
      response,
      prevData
    } = this.state;

    const repos = response.map(item => ({
      text: item.repo,
      value: item.commits.reduce((total, curr) => {
        const isSelectedAuthor =
          selectedMember === ALL_MEMBERS || selectedMember === curr.author;
        const filteredCommits = curr.commits.filter(commit => {
          const commitDate = new Date(commit.date);
          return commitDate >= startDate && commitDate <= endDate;
        });
        return isSelectedAuthor ? total + filteredCommits.length : total;
      }, 0)
    }));

    let authorWiseSums = {};
    response.forEach(repoItem => {
      const { repo, commits } = repoItem;
      const isSelectedRepo =
        selectedRepo === ALL_REPOS || selectedRepo === repo;
      if (isSelectedRepo) {
        commits.forEach(authorCommits => {
          const { author } = authorCommits;
          const filteredCommits = authorCommits.commits.filter(commit => {
            const commitDate = new Date(commit.date);
            return commitDate >= startDate && commitDate <= endDate;
          });

          if (!(author in authorWiseSums)) {
            authorWiseSums[author] = filteredCommits.length;
          } else {
            authorWiseSums[author] =
              authorWiseSums[author] + filteredCommits.length;
          }
        });
      }
    });
    const members = Object.keys(authorWiseSums).map(author => ({
      text: author,
      value: authorWiseSums[author]
    }));

    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline"
          }}
        >
          <div>
            <strong style={{ borderBottom: "4px solid #fee08b" }}>
              Commit activity
            </strong>{" "}
            against{" "}
            <span style={{ borderBottom: "2px dashed #fdae61" }}>
              previous week
            </span>
          </div>
          <div>
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
        </div>
        <Streamgraph
          data={commitsData}
          prevData={prevData}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    );
  }
}
