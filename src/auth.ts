import { CustomAuthorizerEvent, Callback } from "aws-lambda";
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const AUTH0_JWKS_URI = process.env.AUTH0_JWKS_URI;

const generatePolicy = (principalId, effect, resource) => {
  // Policy helper function
  const authResponse: any = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument: any = {};
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    const statementOne: any = {};
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};

const authorizer = (event: CustomAuthorizerEvent, cb: Callback) => {
  if (!event.authorizationToken) {
    return cb(new Error("Unauthorized"));
  }

  const tokenParts = event.authorizationToken.split(" ");
  const tokenValue = tokenParts[1];

  if (!(tokenParts[0].toLowerCase() === "bearer" && tokenValue)) {
    // no auth token!
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
        console.log("verifyError", verifyError);
        // 401 Unauthorized
        console.log(`Token invalid. ${verifyError}`);
        return cb(new Error("Unauthorized"));
      }

      // is custom authorizer function
      console.log("valid from customAuthorizer", decoded);
      return cb(null, generatePolicy(decoded.sub, "Allow", event.methodArn));
    });
  } catch (err) {
    console.log("catch error. Invalid token", err);
    return cb(new Error("Unauthorized"));
  }
};

export default authorizer;
