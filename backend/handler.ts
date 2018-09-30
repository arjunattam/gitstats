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
import * as redis from "./src/redis";

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

  if (isHomepageRequest) {
    accessToken = process.env.DEFAULT_ACCESS_TOKEN;
  }

  const decoded = jwt.decode(accessToken);
  const { sub: userId } = decoded;
  return new UserManager(userId, owner);
};

const buildResponse = (event, message: any) => {
  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({
      message,
      input: event
    })
  };
};

const getCacheKey = (path: string, weekStart: string) => {
  // TODO: add date to this key
  // Q: what if two users have access to the same org
  // but with different permissions?
  // TODO: we should add user id also?
  const suffix = "deploy-3";
  return `${path}-${weekStart}-${suffix}`;
};

const DEFAULT_CACHE_EXPIRY = 3600; // in seconds

const getCachedClientResponse = async (
  event: APIGatewayEvent,
  manager: UserManager,
  methodName: string,
  params: any[]
) => {
  // Checks redis first, else calls the client method
  const { path, queryStringParameters } = event;
  const { week_start: weekStart } = queryStringParameters;

  const cacheKey = getCacheKey(path, weekStart);
  const cacheValue = await redis.get(cacheKey);

  if (!!cacheValue) {
    const parsedJson = JSON.parse(cacheValue);
    return parsedJson;
  }

  const client = await manager.getServiceClient(weekStart);
  const response = await client[methodName](...params);
  await redis.set(cacheKey, JSON.stringify(response), DEFAULT_CACHE_EXPIRY);
  return response;
};

export const report: Handler = async (event: APIGatewayEvent) => {
  const { owner } = event.pathParameters;
  const manager = getManager(event, owner);
  const response = await getCachedClientResponse(event, manager, "report", []);
  return buildResponse(event, response);
};

export const stats: Handler = async (event: APIGatewayEvent) => {
  const { owner, repo } = event.pathParameters;
  const manager = getManager(event, owner);
  const response = await getCachedClientResponse(event, manager, "statistics", [
    repo
  ]);
  return buildResponse(event, { repo, stats: response });
};

export const commits: Handler = async (event: APIGatewayEvent) => {
  const { owner } = event.pathParameters;
  const manager = getManager(event, owner);
  const response = await getCachedClientResponse(
    event,
    manager,
    "allCommits",
    []
  );
  return buildResponse(event, response);
};

export const pulls: Handler = async (event: APIGatewayEvent) => {
  const { owner } = event.pathParameters;
  const manager = getManager(event, owner);
  const response = await getCachedClientResponse(
    event,
    manager,
    "prActivity",
    []
  );
  return buildResponse(event, response);
};

export const teams: Handler = async (event: APIGatewayEvent) => {
  const manager = getManager(event);
  const teams = await manager.getServiceTeams();
  return buildResponse(event, teams);
};

export const email: Handler = async (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body);
  const { to, team, week_start: weekStart } = body;
  const manager = getManager(event, team);
  const context = await manager.getEmailContext(weekStart);

  const { subject } = context;
  await sendEmail(to, subject, context);
  return buildResponse(event, {});
};

export const auth: Handler = (
  event: CustomAuthorizerEvent,
  context: Context,
  cb: Callback
) => authorizer(event, cb);
