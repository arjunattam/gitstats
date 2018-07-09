import React from "react";
import { Container } from "reactstrap";
import { getReport } from "../../utils/api";

const getNextPrevious = (stats, key) => {
  const next = stats
    ? stats.reduce((acc, current) => {
        return acc + current[key].next;
      }, 0)
    : 0;
  const previous = stats
    ? stats.reduce((acc, current) => {
        return acc + current[key].previous;
      }, 0)
    : 0;
  return {
    next,
    previous
  };
};

const parseStats = stats => {
  const commits = getNextPrevious(stats, "commits");
  const added = getNextPrevious(stats, "lines_added");
  const deleted = getNextPrevious(stats, "lines_deleted");
  return { commits, added, deleted };
};

const Member = ({ login, avatar }) => {
  return (
    <span>
      <img src={avatar} style={{ width: 20 }} />
      <span className="m-2">{login}</span>
    </span>
  );
};

const MembersTable = ({ repos, members }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th className="w-25">Member</th>
          <th className="w-25">Commits</th>
          <th className="w-25">Lines added</th>
          <th className="w-25">Lines deleted</th>
        </tr>
      </thead>
      <tbody>
        {members
          ? members.map(member => {
              const memberStats = repos
                .map(repo => {
                  const { stats } = repo;
                  if (stats) {
                    const filtered = stats.filter(
                      stat => stat.login === member.login
                    );
                    if (filtered.length) {
                      return { repo: repo.name, ...filtered[0] };
                    }
                  }
                })
                .filter(stats => stats && !!stats.repo);
              const parsed = parseStats(memberStats);
              return (
                <tr key={member.login}>
                  <td>
                    <Member {...member} />
                  </td>
                  <td>{`${parsed.commits.next} (${
                    parsed.commits.previous
                  })`}</td>
                  <td>{`${parsed.added.next} (${parsed.added.previous})`}</td>
                  <td>{`${parsed.deleted.next} (${
                    parsed.deleted.previous
                  })`}</td>
                </tr>
              );
            })
          : null}
      </tbody>
    </table>
  );
};

const RepoName = ({ name, description }) => {
  return (
    <div>
      {name}
      <div>
        <small>{description}</small>
      </div>
    </div>
  );
};

const ReposTable = ({ repos }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th className="w-25">Repo</th>
          <th className="w-25">Commits</th>
          <th className="w-25">Lines added</th>
          <th className="w-25">Lines deleted</th>
        </tr>
      </thead>
      <tbody>
        {repos
          ? repos.map(repo => {
              const { stats } = repo;
              const parsed = parseStats(stats);
              return (
                <tr key={repo.name}>
                  <td>
                    <RepoName {...repo} />
                  </td>
                  <td>{`${parsed.commits.next} (${
                    parsed.commits.previous
                  })`}</td>
                  <td>{`${parsed.added.next} (${parsed.added.previous})`}</td>
                  <td>{`${parsed.deleted.next} (${
                    parsed.deleted.previous
                  })`}</td>
                </tr>
              );
            })
          : null}
      </tbody>
    </table>
  );
};

class Report extends React.Component {
  state = { responseJson: { status: "Loading" } };

  update() {
    const { params } = this.props.match;
    getReport(params.name)
      .then(response => this.setState({ responseJson: response.message }))
      .catch(error =>
        this.setState({ responseJson: { status: error.toString() } })
      );
  }

  componentDidUpdate(prevProps, prevState) {
    const { params } = this.props.match;
    const { params: prev } = prevProps.match;
    if (prev && prev.name !== params.name) {
      this.update();
    }
  }

  componentDidMount() {
    this.update();
  }

  render() {
    const { responseJson } = this.state;
    return (
      <Container>
        <MembersTable {...responseJson} />
        <ReposTable {...responseJson} />
      </Container>
    );
  }
}

export default Report;
