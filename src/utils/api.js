import axios from "axios";
import Auth from "./auth";
import { MOCK_COMMITS_DATA, MOCK_PR_DATA } from "./data";

const BASE_URL = "https://unb616tblj.execute-api.us-west-1.amazonaws.com/dev";

export const getTeams = () => {
  const auth = new Auth();
  return axios
    .get(`${BASE_URL}/teams`, {
      headers: auth.getAuthHeader()
    })
    .then(response => response.data);
};

export const getCommits = user => {
  if (user === "getsentry") {
    // TODO - please fix this hack
    return new Promise(r => r(MOCK_COMMITS_DATA));
  } else {
    const auth = new Auth();
    return axios
      .get(`${BASE_URL}/commits/${user}`, {
        headers: auth.getAuthHeader()
      })
      .then(response => response.data);
  }
};

export const getPRActivity = user => {
  if (user === "getsentry") {
    // TODO - please fix this hack
    return new Promise(r => r(MOCK_PR_DATA));
  } else {
    const auth = new Auth();
    return axios
      .get(`${BASE_URL}/pulls/${user}`, {
        headers: auth.getAuthHeader()
      })
      .then(response => response.data);
  }
};

export const getReport = username => {
  const auth = new Auth();
  return axios
    .get(`${BASE_URL}/report/${username}`, {
      headers: auth.getAuthHeader()
    })
    .then(response => response.data);
};

export const getRepoStats = (username, repo) => {
  const auth = new Auth();
  return axios
    .get(`${BASE_URL}/stats/${username}/${repo}`, {
      headers: auth.getAuthHeader()
    })
    .then(response => response.data);
};
