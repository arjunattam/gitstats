import axios from "axios";
import {
  ICommitsAPIResult,
  IPullsAPIResult,
  ITeam,
  ITeamInfoAPIResult
} from "gitstats-shared";
import { getAccessToken } from "./auth";

const BASE_URL = "https://unb616tblj.execute-api.us-west-1.amazonaws.com/dev";
// const BASE_URL = "http://localhost:8000";

export const getTeams = async () => {
  const response = await get(`${BASE_URL}/teams`);
  const result: ITeam[] = response.message;
  return result;
};

export const getTeamInfo = async (name, weekStart) => {
  const response = await get(
    `${BASE_URL}/team/${name}?week_start=${weekStart}`
  );
  const result: ITeamInfoAPIResult = response.message;
  return result;
};

export const getPulls = async (owner, repo, weekStart) => {
  const response = await get(
    `${BASE_URL}/pulls/${owner}/${repo}?week_start=${weekStart}`
  );
  const result: IPullsAPIResult = response.message;
  return result;
};

export const getCommits = async (owner, repo, weekStart) => {
  const response = await get(
    `${BASE_URL}/commits/${owner}/${repo}?week_start=${weekStart}`
  );
  const result: ICommitsAPIResult = response.message;
  return result;
};

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
