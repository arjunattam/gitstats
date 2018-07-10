import {
  APIGatewayEvent,
  Callback,
  Context,
  Handler,
  CustomAuthorizerEvent
} from "aws-lambda";
import Github from "./src/github";
import authorizer from "./src/authorizer";
import UserManager from "./src/users";
import BitbucketService from "./src/bitbucket";

const HEADERS = {
  "Access-Control-Allow-Origin": "*", // Required for CORS support to work
  "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
};

const getToken = headers => {
  return headers.Authorization.split(" ")[1];
};

export const report: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const accessToken = getToken(event.headers);
  const { owner } = event.pathParameters;
  const manager = new UserManager(accessToken, owner);

  manager
    .getUserDetails()
    .then(() => manager.getServiceToken())
    .then(token => {
      const gh = new BitbucketService(token, owner);

      gh.report().then(response => {
        cb(null, {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify({
            message: response,
            input: event
          })
        });
      });
    });
};

export const stats: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const accessToken = getToken(event.headers);
  const { owner, repo } = event.pathParameters;
  const manager = new UserManager(accessToken, owner);

  manager
    .getUserDetails()
    .then(() => manager.getServiceToken())
    .then(token => {
      const gh = new Github(token, owner);

      gh.statistics(repo).then(response => {
        cb(null, {
          statusCode: 200,
          headers: HEADERS,
          body: JSON.stringify({
            message: { repo, stats: response },
            input: event
          })
        });
      });
    });
};

export const teams: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const accessToken = getToken(event.headers);
  const manager = new UserManager(accessToken);

  manager
    .getUserDetails()
    .then(() => manager.getServiceTeams())
    .then(response => {
      cb(null, {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({
          message: response,
          input: event
        })
      });
    });
};

export const auth: Handler = (
  event: CustomAuthorizerEvent,
  context: Context,
  cb: Callback
) => {
  return authorizer(event, cb);
};
