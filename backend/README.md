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

## Deployment

```
sls deploy --verbose
```

The Lambda functions run inside a VPC on AWS, which is also where the ElastiCache instance (Redis) runs.

- [This link](https://causecode.com/serverless-with-aws-elasticache/) details how that is setup.
- [Docs link](https://aws.amazon.com/premiumsupport/knowledge-center/internet-access-lambda-function/) for giving internet access to Lambda functions inside VPC.
