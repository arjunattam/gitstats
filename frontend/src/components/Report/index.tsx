import { ITeam } from "gitstats-shared";
import * as React from "react";
import { connect } from "react-redux";
import { Report } from "./report";

const ReportPageContainer = ({ match, data }) => {
  const { teams: storeTeams } = data;
  const { name: selectedLogin } = match.params;
  const filteredTeams = storeTeams.filter(t => t.login === selectedLogin);
  let team: ITeam;

  if (filteredTeams.length > 0) {
    team = filteredTeams[0];
  }

  return <Report team={team} teamLogin={selectedLogin} />;
};

function mapStateToProps(state) {
  const { data } = state;
  return { data };
}

export const ReportPage = connect(mapStateToProps)(ReportPageContainer);
