import axios from "axios";
import Auth from "./auth";

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
  const auth = new Auth();
  return axios
    .get(`${BASE_URL}/commits/${user}`, {
      headers: auth.getAuthHeader()
    })
    .then(response => response.data);
};

export const getPRActivity = user => {
  const auth = new Auth();
  return axios
    .get(`${BASE_URL}/pulls/${user}`, {
      headers: auth.getAuthHeader()
    })
    .then(response => response.data);
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
