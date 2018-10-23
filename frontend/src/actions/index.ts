import { getTeams } from "../utils/api";
import {
  AuthWidget,
  getGitService,
  getUserProfile,
  isAuthenticated,
  logout as doLogout
} from "../utils/auth";

function getAuthPayload() {
  const { nickname, picture } = getUserProfile();
  return {
    isLoggedIn: isAuthenticated(),
    service: getGitService(),
    teams: [],
    user: { name: nickname, avatar: picture }
  };
}

export function initializeAuth() {
  return {
    payload: getAuthPayload(),
    type: "INITIALIZE_AUTH_STATE"
  };
}

export function login() {
  const auth = new AuthWidget();
  auth.login();
  return {
    payload: getAuthPayload(),
    type: "AUTH_STATE_UPDATED"
  };
}

export function authenticated() {
  return {
    payload: getAuthPayload(),
    type: "AUTH_STATE_UPDATED"
  };
}

export function logout() {
  doLogout();
  return {
    payload: getAuthPayload(),
    type: "AUTH_STATE_UPDATED"
  };
}

export function fetchTeams(data) {
  return {
    payload: getTeams(),
    type: "FETCH_TEAMS"
  };
}
