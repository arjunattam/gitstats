import { createReducer } from "redux-create-reducer";

const initialState = {
  isLoggedIn: false,
  user: {},
  service: undefined,
  teams: []
};

export default createReducer(initialState, {
  INITIALIZE_AUTH_STATE: (state, action) => {
    return {
      ...state,
      ...action.payload
    };
  },
  AUTH_STATE_UPDATED: (state, action) => {
    return {
      ...state,
      ...action.payload
    };
  },
  FETCH_TEAMS_PENDING: (state, action) => {
    return {
      ...state,
      teams: [
        {
          name: "Loading teams",
          login: "loader"
        }
      ]
    };
  },
  FETCH_TEAMS_FULFILLED: (state, action) => {
    const { payload } = action;
    const { message: teams } = payload;
    const withService = teams.map(team => ({
      ...team,
      service: state.service
    }));
    return {
      ...state,
      teams: withService
    };
  }
});
