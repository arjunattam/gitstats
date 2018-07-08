import axios from "axios";
import Auth from "./auth";

const BASE_URL = "https://unb616tblj.execute-api.us-west-1.amazonaws.com/dev";

export const getReport = (username, reponame) => {
  const auth = new Auth();

  return axios
    .get(`${BASE_URL}/report/${username}/${reponame}`, {
      headers: auth.getAuthHeader()
    })
    .then(response => response.data);
};
