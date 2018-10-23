import axios from "axios";
import {
  CommitsAPIResult,
  PullsAPIResult,
  Team,
  TeamInfoAPIResult
} from "gitstats-shared";
import { getAccessToken } from "./auth";

const BASE_URL = "https://unb616tblj.execute-api.us-west-1.amazonaws.com/dev";
// const BASE_URL = "http://localhost:8000";

export const getTeams = async () => {
  const response = await get(`${BASE_URL}/teams`);
  const result: Team[] = response.message;
  return result;
};

export const getTeamInfo = async (name, weekStart) => {
  const response = await get(
    `${BASE_URL}/team/${name}?week_start=${weekStart}`
  );
  const result: TeamInfoAPIResult = response.message;
  return result;
};

export const getPullsV2 = async (owner, repo, weekStart) => {
  const response = await get(
    `${BASE_URL}/pulls/v2/${owner}/${repo}?week_start=${weekStart}`
  );
  const result: PullsAPIResult = response.message;
  return result;
};

export const getCommitsV2 = async (owner, repo, weekStart) => {
  const response = await get(
    `${BASE_URL}/commits/v2/${owner}/${repo}?week_start=${weekStart}`
  );
  const result: CommitsAPIResult = response.message;
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
