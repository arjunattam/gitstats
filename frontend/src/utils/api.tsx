import axios from "axios";
import { TeamInfoAPIResult } from "gitstats-shared";
import { getAccessToken } from "./auth";

const BASE_URL = "https://unb616tblj.execute-api.us-west-1.amazonaws.com/dev";
// const BASE_URL = "http://localhost:8000";

export const getTeams = () => get(`${BASE_URL}/teams`);

export const getTeamInfo = async name => {
  const response = await get(`${BASE_URL}/team/${name}`);
  const result: TeamInfoAPIResult = response.message;
  return result;
};

export const getCommits = (owner, weekStart) =>
  get(`${BASE_URL}/commits/${owner}?week_start=${weekStart}`);

export const getPRActivity = (owner, weekStart) =>
  get(`${BASE_URL}/pulls/${owner}?week_start=${weekStart}`);

export const getReport = (owner, weekStart) =>
  get(`${BASE_URL}/report/${owner}?week_start=${weekStart}`);

export const getRepoStats = (owner, repo, weekStart) =>
  get(`${BASE_URL}/stats/${owner}/${repo}?week_start=${weekStart}`);

export const sendEmail = (toEmail, team, weekStart) =>
  post(`${BASE_URL}/email`, { to: toEmail, team, week_start: weekStart });

const getHeader = () => {
  let accessToken = getAccessToken();
  if (!accessToken) {
    accessToken = "dummy-token-for-homepage";
  }
  return { Authorization: `bearer ${accessToken}` };
};

const get = async path => {
  const response = await axios.get(path, {
    headers: getHeader()
  });
  return response.data;
};

const post = async (path, body) => {
  const response = await axios.post(path, body, {
    headers: getHeader()
  });
  return response.data;
};
