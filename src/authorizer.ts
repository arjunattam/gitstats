import { CustomAuthorizerEvent, Callback } from "aws-lambda";
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const AUTH0_JWKS_URI = process.env.AUTH0_JWKS_URI;

const getAllResources = methodArn => {
  // Input: arn:aws:execute-api:us-west-1:750374355341:unb616tblj/dev/GET/report/karigari/mercury
  //         0   1       2          3        4              5
  // Returns: arn:aws:execute-api:us-west-1:750374355341:unb616tblj/dev/GET/*
  const split = methodArn.split(":");
  var apiGatewayArnTmp = split[5].split("/");
  const apiId = apiGatewayArnTmp[0];
  const stage = apiGatewayArnTmp[1];
  const method = apiGatewayArnTmp[2];
  return `${split[0]}:${split[1]}:${split[2]}:${split[3]}:${
    split[4]
  }:${apiId}/${stage}/${method}/*`;
};

const generatePolicy = (principalId, effect, resource) => {
  // Policy helper function
  const authResponse: any = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: getAllResources(resource)
        }
      ]
    };
    authResponse.policyDocument = policyDocument;
  }
  console.log("resource", getAllResources(resource));
  return authResponse;
};

const authorizer = (event: CustomAuthorizerEvent, cb: Callback) => {
  if (!event.authorizationToken) {
    return cb(new Error("Unauthorized"));
  }

  const tokenParts = event.authorizationToken.split(" ");
  const tokenValue = tokenParts[1];

  if (!(tokenParts[0].toLowerCase() === "bearer" && tokenValue)) {
    return cb(new Error("Unauthorized"));
  }
  const options = {
    audience: AUTH0_AUDIENCE
  };

  var client = jwksClient({
    jwksUri: AUTH0_JWKS_URI
  });

  function getKey(header, callback) {
    client.getSigningKey(header.kid, function(err, key) {
      var signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  }

  try {
    jwt.verify(tokenValue, getKey, options, function(verifyError, decoded) {
      if (verifyError) {
        console.log(`Token invalid. ${verifyError}`);
        return cb(new Error("Unauthorized"));
      }

      return cb(null, generatePolicy(decoded.sub, "Allow", event.methodArn));
    });
  } catch (err) {
    console.log("Catch error", err);
    return cb(new Error("Unauthorized"));
  }
};

export default authorizer;
