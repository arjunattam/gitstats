import {
  APIGatewayEvent,
  Callback,
  Context,
  Handler,
  CustomAuthorizerEvent
} from "aws-lambda";
import Github from "./src/github";
import authorizer from "./src/auth";

const HEADERS = {
  "Access-Control-Allow-Origin": "*", // Required for CORS support to work
  "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
};

export const report: Handler = (
  event: APIGatewayEvent,
  context: Context,
  cb: Callback
) => {
  const { owner, repo } = event.pathParameters;
  const gh = new Github(owner, repo);

  Promise.all([gh.stargazers(), gh.issues()]).then(values => {
    cb(null, {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        message: values,
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
