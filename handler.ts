import {
  APIGatewayEvent,
  Callback,
  Context,
  Handler,
  CustomAuthorizerEvent
} from "aws-lambda";
import authorizer from "./src/authorizer";
import UserManager from "./src/users";

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

  manager.getServiceClient().then(client =>
    client.report().then(response => {
      cb(null, {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({
          message: response,
          input: event
        })
      });
    })
  );
};

export const stats: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const accessToken = getToken(event.headers);
  const { owner, repo } = event.pathParameters;
  const manager = new UserManager(accessToken, owner);

  manager.getServiceClient().then(client =>
    client.statistics(repo).then(response => {
      cb(null, {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({
          message: { repo, stats: response },
          input: event
        })
      });
    })
  );
};

export const teams: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const accessToken = getToken(event.headers);
  const manager = new UserManager(accessToken);

  manager.getServiceTeams().then(response => {
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
