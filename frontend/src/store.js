import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import promise from "redux-promise-middleware";
import logger from "redux-logger";
import data from "./reducers";

export default createStore(
  combineReducers({
    data
  }),
  {},
  applyMiddleware(thunk, promise(), logger)
);
