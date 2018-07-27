# gitstats.report

This is the repository that powers [gitstats.report](https://gitstats.report). The repo is organised as

- frontend: This is a react application, deployed via Netlify
- backend: This is a serverless application, deployed to AWS Lambda

## Usage

To develop on this repo, you will require the `backend/env.yml` file, which can be obtained via this [protected link](https://drive.google.com/drive/u/1/folders/1A7RbYE2b1IyeDqm0NLU0t9aubo4OgkWz).

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
```
