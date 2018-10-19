# gitstats

This is the repository that powers [gitstats.report](https://gitstats.report).

## Code

The repo is organised as:

- `frontend`: This is a react application, deployed via Netlify
- `backend`: This is a serverless application, deployed to AWS Lambda
- `shared`: This contains typescript interface definitions that are shared between frontend and backend

The `shared` components are not automatically updated after changes. Whenever shared code is changed:

1. Run `npm run build` inside shared
2. Run `yarn add '../shared'` inside frontend or backend

## Support
