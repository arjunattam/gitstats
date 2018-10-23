import { createReducer } from "redux-create-reducer";

const initialState = {
  isLoggedIn: false,
  service: undefined,
  teams: [],
  user: {}
};

export default createReducer(initialState, {
  AUTH_STATE_UPDATED: (state, action: any) => {
    return {
      ...state,
      ...action.payload
    };
  },
  FETCH_TEAMS_FULFILLED: (state, action: any) => {
    return {
      ...state,
      teams: action.payload
    };
  },
  FETCH_TEAMS_PENDING: (state, action: any) => {
    return {
      ...state,
      teams: [
        {
          login: "loader",
          name: "Loading teams"
        }
      ]
    };
  },
  INITIALIZE_AUTH_STATE: (state, action: any) => {
    return {
      ...state,
      ...action.payload
    };
  }
});
