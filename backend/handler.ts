import {
  APIGatewayEvent,
  Callback,
  Context,
  Handler,
  CustomAuthorizerEvent
} from "aws-lambda";
import * as jwt from "jsonwebtoken";
import authorizer from "./src/authorizer";
import UserManager from "./src/userManager";
import { sendEmail } from "./src/email";
import * as cache from "./src/redis";

const HEADERS = {
  // Required for cookies, authorization headers with HTTPS
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true
};

const getToken = (event: APIGatewayEvent) => {
  const { Authorization } = event.headers;

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

  const decoded: any = jwt.decode(accessToken as string);
  const { sub: userId } = decoded;
  const headerUserId = event.headers["x-user-id"];
  const isAdmin =
    userId === process.env.ADMIN_USER_ID_BITBUCKET ||
    userId === process.env.ADMIN_USER_ID_GITHUB;
  return isAdmin && headerUserId
    ? new UserManager(headerUserId, owner)
    : new UserManager(userId, owner);
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

const getCacheKey = (path: string, userId: string, weekStart: string) => {
  const nonceSuffix = "2";
  return `${userId}-${path}-${weekStart}-${nonceSuffix}`;
};

const DEFAULT_CACHE_EXPIRY = 3600 * 24; // in seconds

export const commits: Handler = async (event: APIGatewayEvent) => {
  const { path, pathParameters, queryStringParameters } = event;
  const { week_start: weekStart } = queryStringParameters as any;
  const { owner, repo } = pathParameters as any;
  const manager = getManager(event, owner);
  const cacheKey = getCacheKey(path, manager.userId, weekStart);
  const cachedValue = await cache.getJson(cacheKey);

  if (!!cachedValue) {
    return buildResponse(event, cachedValue);
  }

  const client = await manager.getServiceClient(weekStart);
  const response = await client.commits(repo);

  if (!response.is_pending) {
    await cache.setJson(cacheKey, response, DEFAULT_CACHE_EXPIRY);
  }

  return buildResponse(event, response);
};

export const pulls: Handler = async (event: APIGatewayEvent) => {
  const { path, pathParameters, queryStringParameters } = event;
  const { week_start: weekStart } = queryStringParameters as any;
  const { owner, repo } = pathParameters as any;
  const manager = getManager(event, owner);
  const cacheKey = getCacheKey(path, manager.userId, weekStart);
  const cachedValue = await cache.getJson(cacheKey);

  if (!!cachedValue) {
    return buildResponse(event, cachedValue);
  }

  const client = await manager.getServiceClient(weekStart);
  const response = await client.pulls(repo);
  await cache.setJson(cacheKey, response, DEFAULT_CACHE_EXPIRY);
  return buildResponse(event, response);
};

export const teamInfo: Handler = async (event: APIGatewayEvent) => {
  const { path, pathParameters, queryStringParameters } = event;
  const { week_start: weekStart } = queryStringParameters as any;
  const { owner } = pathParameters as any;
  const manager = getManager(event, owner);
  const cacheKey = getCacheKey(path, manager.userId, weekStart);
  const cachedValue = await cache.getJson(cacheKey);

  if (!!cachedValue) {
    return buildResponse(event, cachedValue);
  }

  const client = await manager.getServiceClient(weekStart);
  const response = await client.teamInfo();
  await cache.setJson(cacheKey, response, DEFAULT_CACHE_EXPIRY);
  return buildResponse(event, response);
};

export const teams: Handler = async (event: APIGatewayEvent) => {
  const manager = getManager(event);
  const teams = await manager.getServiceTeams();
  return buildResponse(event, teams);
};

export const email: Handler = async (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body as string);
  const { to, team, week_start: weekStart } = body;
  const manager = getManager(event, team);
  const context = await manager.getEmailContext(weekStart);

  if (!!context) {
    const { subject } = context;
    await sendEmail(to, subject, context);
    return buildResponse(event, {});
  }
};

export const auth: Handler = (
  event: CustomAuthorizerEvent,
  context: Context,
  cb: Callback
) => authorizer(event, cb);
