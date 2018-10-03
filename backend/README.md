# gitstats-serverless

## Usage

1.  Setup the environment

    ```
    yarn
    ```

2.  Run locally (uses the serverless-offline plugin), and then access routes at localhost:3000

    ```
    npm run start
    ```

3.  Run with vscode debugger: F5 inside vscode

## Environment variables

To run the backend, you will require `env.yml` file, which can be obtained via this [protected link](https://drive.google.com/drive/u/1/folders/1A7RbYE2b1IyeDqm0NLU0t9aubo4OgkWz).

```
dev:
  AUTH0_AUDIENCE: actual-value-here
  AUTH0_ISSUER: actual-value-here
  AUTH0_JWKS_URI: actual-value-here
  AUTH0_MANAGER_TOKEN_URL: actual-value-here
  AUTH0_MANAGER_CLIENT_ID: actual-value-here
  AUTH0_MANAGER_CLIENT_SECRET: actual-value-here
  AUTH0_MANAGER_AUDIENCE: actual-value-here
  GITHUB_APP_PRIVATE_KEY: actual-value-here
  GITHUB_APP_ID: actual-value-here
  BITBUCKET_CLIENT_ID: actual-value-here
  BITBUCKET_CLIENT_SECRET: actual-value-here
  SES_ACCESS_KEY_ID: actual-value-here
  SES_SECRET_ACCESS_KEY: actual-value-here
  SES_REGION: actual-value-here
```

## Deployment

```
sls deploy --verbose
```

The Lambda functions run inside a VPC on AWS, which is also where the ElastiCache instance (Redis) runs.

- [This link](https://causecode.com/serverless-with-aws-elasticache/) details how that is setup.
- [Docs link](https://aws.amazon.com/premiumsupport/knowledge-center/internet-access-lambda-function/) for giving internet access to Lambda functions inside VPC.
