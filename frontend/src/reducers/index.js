import { createReducer } from "redux-create-reducer";

const initialState = {
  isLoggedIn: false,
  user: {},
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
  }
});
