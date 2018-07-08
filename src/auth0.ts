const rp = require("request-promise-native");

export default class Auth0Manager {
  managementToken: string | undefined;

  getToken() {
    const {
      AUTH0_MANAGER_TOKEN_URL: uri,
      AUTH0_MANAGER_AUDIENCE: audience,
      AUTH0_MANAGER_CLIENT_ID: clientId,
      AUTH0_MANAGER_CLIENT_SECRET: clientSecret
    } = process.env;

    return rp({
      uri,
      method: "POST",
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        grant_type: "client_credentials"
      },
      json: true
    }).then(response => {
      this.managementToken = response.access_token;
      return this.managementToken;
    });
  }

  getUser(userId: string) {
    const { AUTH0_MANAGER_AUDIENCE: baseUrl } = process.env;
    return rp({
      uri: `${baseUrl}users/${userId}`,
      headers: {
        Authorization: `Bearer ${this.managementToken}`
      },
      json: true
    }).then(response => {
      return response;
    });
  }
}
