import React from "react";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import { getCommits, getPRActivity } from "../../utils/api";
import { Streamgraph, PRActivity } from "../Charts";

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

  getTotalValue = () => {
    const { items } = this.props;
    return items.reduce((sum, current) => sum + current.value, 0);
  };

  getSelectedText = () => {
    const { selected, items, allText } = this.props;

    if (selected === allText) {
      return `${selected} (${this.getTotalValue()})`;
    } else {
      const filtered = items.filter(i => i.text === selected);
      let value = 0;
      if (filtered.length > 0) {
        value = filtered[0].value;
      }
      return `${selected} (${value})`;
    }
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
        <TitleDiv>
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
        </TitleDiv>
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

export class PRChartContainer extends React.Component {
  state = { data: [], selectedRepo: "" };

  componentDidMount() {
    const { username } = this.props;
    getPRActivity(username).then(response => {
      const { message } = response;

      if (message) {
        let selectedRepo = "";
        const filtered = message
          .map(({ repo, pulls }) => ({
            text: repo,
            value: this.filteredPulls(pulls).length
          }))
          .filter(item => item.value > 0);

        if (filtered.length) {
          selectedRepo = filtered[0].text;
        }

        this.setState({ data: message, selectedRepo });
      }
    });
  }

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
    const { data, selectedRepo } = this.state;
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
        <PRActivity data={pullsData} {...this.props} />
      </div>
    );
  }
}
