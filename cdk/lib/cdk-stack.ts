// cdk/lib/cdk-stack.ts

import { aws_cognito as cognito, aws_s3 as s3, aws_lambda as lambda, aws_iam as iam, aws_cloudfront as cloudfront } from "aws-cdk-lib";
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

export class HandTermCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'HandTermUserPool', {
      userPoolName: 'HandTermUserPool',
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email for our app!',
        emailBody: 'Hello {username}, Thanks for signing up to our app! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      signInAliases: {
        email: true
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      autoVerify: { email: true }
    });

    // Cognito User Pool Client
    const userPoolClient = userPool.addClient('AppClient', {
      authFlows: {
        userSrp: true,
      },
      generateSecret: false,
    });

    // Cognito Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'HandTermIdentityPool', {
      identityPoolName: 'HandTermIdentityPool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: userPoolClient.userPoolClientId,
        providerName: userPool.userPoolProviderName,
      }],
    });

    // S3 Bucket for User Logs
    const logsBucket = new s3.Bucket(this, 'HandTermHistoryBucket', {
      bucketName: 'handterm',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Lambda Execution Role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('edgelambda.amazonaws.com')
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
      ],
    });

    // Lambda@Edge Function for HttpOnly Cookies
    const lambdaAtEdge = new lambda.Function(this, 'LambdaAtEdgeFunction', {
      runtime: lambda.Runtime.NODEJS_16_X, // Note: Ensure you're using a runtime supported by Lambda@Edge
      handler: 'app.lambdaHandler', // Adjusted to point to the transpiled JS file and handler
      code: lambda.Code.fromAsset('lambda/handtermEdgeFunction/'), // Pointing to the directory
      role: lambdaExecutionRole,
      memorySize: 128,
      description: 'A Lambda@Edge function for HttpOnly Cookies',
    });


    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'IdentityPoolId', { value: identityPool.ref });
    new cdk.CfnOutput(this, 'BucketName', { value: logsBucket.bucketName });
    new cdk.CfnOutput(this, 'LambdaAtEdgeFunctionName', { value: lambdaAtEdge.functionName });
  }
}

const app = new cdk.App();
new HandTermCdkStack(app, 'HandTermCdkStack');