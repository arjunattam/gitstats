import {
  isAuthenticated,
  getUserProfile,
  logout as doLogout,
  AuthWidget
} from "../utils/auth";
import { getTeams } from "../utils/api";

function getAuthPayload() {
  const { nickname, picture } = getUserProfile();
  return {
    isLoggedIn: isAuthenticated(),
    user: { name: nickname, avatar: picture },
    teams: []
  };
}

export function initializeAuth() {
  return {
    type: "INITIALIZE_AUTH_STATE",
    payload: getAuthPayload()
  };
}

export function login() {
  const auth = new AuthWidget();
  auth.login();
  return {
    type: "AUTH_STATE_UPDATED",
    payload: getAuthPayload()
  };
}

export function authenticated() {
  return {
    type: "AUTH_STATE_UPDATED",
    payload: getAuthPayload()
  };
}

export function logout() {
  doLogout();
  return {
    type: "AUTH_STATE_UPDATED",
    payload: getAuthPayload()
  };
}

export function fetchTeams(data) {
  return {
    type: "FETCH_TEAMS",
    payload: getTeams()
  };
}
