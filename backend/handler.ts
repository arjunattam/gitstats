import {
  APIGatewayEvent,
  Callback,
  Context,
  Handler,
  CustomAuthorizerEvent
} from "aws-lambda";
import * as jwt from "jsonwebtoken";
import authorizer from "./src/authorizer";
import UserManager from "./src/users";
import { sendEmail } from "./src/email";

const HEADERS = {
  "Access-Control-Allow-Origin": "*", // Required for CORS support to work
  "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
};

const getToken = (event: APIGatewayEvent) => {
  const { headers } = event;
  const { Authorization } = headers;

  if (!!Authorization) {
    return Authorization.split(" ")[1];
  }
};

const getManager = (event: APIGatewayEvent, owner?: string) => {
  let accessToken = getToken(event);
  const isHomepageRequest = owner === "getsentry";

  if (!accessToken && isHomepageRequest) {
    accessToken = process.env.DEFAULT_ACCESS_TOKEN;
  }

  const decoded = jwt.decode(accessToken);
  const { sub: userId } = decoded;
  return new UserManager(userId, owner);
};

export const report: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const { owner } = event.pathParameters;
  const manager = getManager(event, owner);

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
  const { owner, repo } = event.pathParameters;
  const manager = getManager(event, owner);

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
  const manager = getManager(event);

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

export const commits: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const { owner } = event.pathParameters;
  const manager = getManager(event, owner);

  manager.getServiceClient().then(client =>
    client.allCommits().then(response => {
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

export const pulls: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const { owner } = event.pathParameters;
  const manager = getManager(event, owner);

  manager.getServiceClient().then(client => {
    return client.prActivity().then(response => {
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

export const email: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const body = JSON.parse(event.body);
  const { to, team } = body;
  const manager = getManager(event, team);

  manager.getEmailContext().then(context => {
    const { subject } = context;

    sendEmail(to, subject, context).then(response => {
      cb(null, {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({
          message: {},
          input: event
        })
      });
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
