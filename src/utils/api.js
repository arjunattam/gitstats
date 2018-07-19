import axios from "axios";
import Auth from "./auth";
import { MOCK_DATA } from "./data";

const BASE_URL = "https://unb616tblj.execute-api.us-west-1.amazonaws.com/dev";

const getMockReport = () => {
  return new Promise((resolve, _) => {
    setTimeout(() => resolve(MOCK_DATA), 4000);
  });
};

export const getTeams = () => {
  const auth = new Auth();
  return axios
    .get(`${BASE_URL}/teams`, {
      headers: auth.getAuthHeader()
    })
    .then(response => response.data);
};

export const getCommits = (user, repo) => {
  const auth = new Auth();
  return axios
    .get(`${BASE_URL}/commits/${user}/${repo}`, {
      headers: auth.getAuthHeader()
    })
    .then(response => {
      const { message } = response.data;
      let result = [];

      Object.keys(message).forEach(author => {
        const commits = message[author];
        result.push(commits.map(commit => ({ x: commit.date, y: 1 })));
      });

      return result;
    });
};

export const getPRActivity = (user, repo, pr) => {
  const auth = new Auth();
  return axios
    .get(`${BASE_URL}/pulls/${user}/${repo}/${pr}`, {
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
