import axios from "axios";
import { Auth } from "./auth";

const BASE_URL = "https://unb616tblj.execute-api.us-west-1.amazonaws.com/dev";
// const BASE_URL = "http://localhost:8000";

export const getTeams = () => get(`${BASE_URL}/teams`);

export const getCommits = owner => get(`${BASE_URL}/commits/${owner}`);

export const getPRActivity = owner => get(`${BASE_URL}/pulls/${owner}`);

export const getReport = owner => get(`${BASE_URL}/report/${owner}`);

export const getRepoStats = (owner, repo) =>
  get(`${BASE_URL}/stats/${owner}/${repo}`);

export const sendEmail = (toEmail, team) =>
  post(`${BASE_URL}/email`, { to: toEmail, team });

const get = async path => {
  const auth = new Auth();
  const response = await axios.get(path, {
    headers: auth.getAuthHeader()
  });
  return response.data;
};

const post = async (path, body) => {
  const auth = new Auth();
  const response = await axios.post(path, body, {
    headers: auth.getAuthHeader()
  });
  return response.data;
};
