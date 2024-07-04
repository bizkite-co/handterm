// cdk/lib/cdk-stack.ts
import { ENDPOINTS } from '../lambda/cdkshared/endpoints';
import {
  aws_cognito as cognito,
  aws_s3 as s3,
  aws_lambda as lambda,
  aws_iam as iam,
  aws_apigatewayv2 as apigatewayv2,
  aws_apigatewayv2_integrations as apigatewayv2Integrations,
  App,
  CfnOutput,
  Stack,
  aws_apigatewayv2_authorizers as apigatewayv2authorizers,
  StackProps
} from "aws-cdk-lib";
import { Construct } from 'constructs';
import { HttpMethod, HttpApi, CorsHttpMethod, HttpAuthorizerType } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'; // This path is illustrative and likely incorrect
import { HttpJwtAuthorizer, HttpLambdaAuthorizer, HttpLambdaAuthorizerProps } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

const nodeRuntime = lambda.Runtime.NODEJS_16_X;
const region = "us-east-1";

export class HandTermCdkStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: StackProps
  ) {
    super(scope, id, props);
    const allowHeaders = [
      'Content-Type',
      'X-Amz-Date',
      'Authorization',
      'X-Api-Key',
      'X-Requested-With',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform'
    ];
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

    // TODO: Remove this before production. This is only to make signup easier during development
    const preSignupLambda = new lambda.Function(this, 'PreSignupLambda', {
      runtime: nodeRuntime,
      handler: 'preSignup.handler',
      code: lambda.Code.fromAsset('lambda/authentication'),
    });
    userPool.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, preSignupLambda);

    // Cognito User Pool Client
    const userPoolClient = userPool.addClient('AppClient', {
      authFlows: {
        userSrp: true,
        userPassword: true // Enable USER_PASSWORD_AUTH flow
      },
      generateSecret: false,
      // Add your API Gateway endpoint URL to the list of callback URLs
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
      bucketName: ENDPOINTS.aws.s3.bucketName,
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

    const authorizerLambda: IFunction = new lambda.Function(this, 'AuthorizerFunction', {
      runtime: nodeRuntime,
      handler: 'authorizer.handler',
      code: lambda.Code.fromAsset('lambda/authentication'),
      environment: {
        COGNITO_USER_POOL_ID: userPool.userPoolId
      }
    });

    // Define the authorizer with the correct constructor arguments
    const lambdaAuthorizer = new HttpLambdaAuthorizer('CustomAuthorizer', authorizerLambda, {
      identitySource: ['$request.header.Authorization']
    });

    // Define the HTTP API
    const httpApi = new HttpApi(this, 'HandTermApi', {
      apiName: 'HandTermService',
      description: 'This service serves authentication requests.',
      // CORS configuration if needed
      corsPreflight: {
        allowOrigins: ['http://localhost:5173', 'https://handterm.com'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });

    const signUpLambda = new lambda.Function(this, 'SignUpFunction', {
      runtime: nodeRuntime,
      handler: 'signUp.handler',
      role: lambdaExecutionRole,
      code: lambda.Code.fromAsset('lambda/authentication'),
      environment: {
        COGNITO_APP_CLIENT_ID: userPoolClient.userPoolClientId,
      }
    });
    const signUpIntegration = new HttpLambdaIntegration('signup-integration', signUpLambda);
    httpApi.addRoutes({
      path: ENDPOINTS.api.SignUp,
      methods: [HttpMethod.POST],
      integration: signUpIntegration,
    })

    const signInLambda = new lambda.Function(this, 'SignInFunction', {
      runtime: nodeRuntime,
      handler: 'signIn.handler',
      role: lambdaExecutionRole,
      code: lambda.Code.fromAsset('lambda/authentication'),
      environment: {
        COGNITO_APP_CLIENT_ID: userPoolClient.userPoolClientId,
      }
    });

    httpApi.addRoutes({
      path: ENDPOINTS.api.SignIn,
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        'post-user-signin',
        signInLambda
      ),
    })

    const refreshTokenLambda = new lambda.Function(this, 'RefreshTokenFunction', {
      runtime: nodeRuntime,
      handler: 'refreshToken.handler',
      role: lambdaExecutionRole,
      code: lambda.Code.fromAsset('lambda/authentication'),
      environment: {
        COGNITO_APP_CLIENT_ID: userPoolClient.userPoolClientId,
      }
    });

    httpApi.addRoutes({
      path: ENDPOINTS.api.RefreshToken,
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        'post-user-signin',
        refreshTokenLambda
      ),
    })

    const changePasswordLambda = new lambda.Function(this, 'ChangePasswordFunction', {
      runtime: nodeRuntime,
      handler: 'changePassword.handler',
      role: lambdaExecutionRole,
      code: lambda.Code.fromAsset('lambda/authentication'),
      environment: {
        COGNITO_APP_CLIENT_ID: userPoolClient.userPoolClientId,
      }
    });
    const changePasswordIntegration = new HttpLambdaIntegration('change-password-integration', changePasswordLambda);

    httpApi.addRoutes({
      path: ENDPOINTS.api.ChangePassword,
      authorizer: lambdaAuthorizer,
      methods: [HttpMethod.POST],
      integration: changePasswordIntegration,
    })

    const getUserLambda = new lambda.Function(this, 'GetUserFunction', {
      runtime: nodeRuntime,
      handler: 'getUser.handler',
      role: lambdaExecutionRole,
      code: lambda.Code.fromAsset('lambda/userStorage'),
      environment: {
        COGNITO_APP_CLIENT_ID: userPoolClient.userPoolClientId,
      }
    });
    const getUserIntegration = new HttpLambdaIntegration('get-user-integration', getUserLambda);
    httpApi.addRoutes({
      path: ENDPOINTS.api.GetUser,
      authorizer: lambdaAuthorizer,
      methods: [HttpMethod.GET],
      integration: getUserIntegration,
    })

    const setUserLambda = new lambda.Function(this, 'SetUserFunction', {
      runtime: nodeRuntime,
      handler: 'setUser.handler',
      role: lambdaExecutionRole,
      code: lambda.Code.fromAsset('lambda/userStorage'),
      environment: {
        COGNITO_APP_CLIENT_ID: userPoolClient.userPoolClientId,
      }
    });
    const setUserIntegration = new HttpLambdaIntegration('set-user-integration', setUserLambda);
    httpApi.addRoutes({
      path: ENDPOINTS.api.SetUser,
      authorizer: lambdaAuthorizer,
      methods: [HttpMethod.POST],
      integration: setUserIntegration,
    })

    const saveLogLambda = new lambda.Function(this, 'SaveLogFunction', {
      runtime: nodeRuntime,
      handler: 'saveLog.handler',
      role: lambdaExecutionRole,
      code: lambda.Code.fromAsset('lambda/userStorage'),
      environment: {
        COGNITO_APP_CLIENT_ID: userPoolClient.userPoolClientId,
      }
    });
    const saveLogIntegration = new HttpLambdaIntegration('save-log-integration', saveLogLambda);
    httpApi.addRoutes({
      path: ENDPOINTS.api.SaveLog,
      authorizer: lambdaAuthorizer,
      methods: [HttpMethod.POST],
      integration: saveLogIntegration,
    })

    const getLogLambda = new lambda.Function(this, 'GetLogFunction', {
      runtime: nodeRuntime,
      handler: 'getLog.handler',
      role: lambdaExecutionRole,
      code: lambda.Code.fromAsset('lambda/userStorage'),
      environment: {
        COGNITO_APP_CLIENT_ID: userPoolClient.userPoolClientId,
      }
    });
    const getLogIntegration = new HttpLambdaIntegration('get-log-integration', getLogLambda);
    httpApi.addRoutes({
      path: ENDPOINTS.api.GetLog,
      authorizer: lambdaAuthorizer,
      methods: [HttpMethod.POST],
      integration: getLogIntegration,
    })

    const listLogLambda = new lambda.Function(this, 'ListLogFunction', {
      runtime: nodeRuntime,
      handler: 'listLog.handler',
      role: lambdaExecutionRole,
      code: lambda.Code.fromAsset('lambda/userStorage'),
      environment: {
        COGNITO_APP_CLIENT_ID: userPoolClient.userPoolClientId,
      }
    });
    const listLogIntegration = new HttpLambdaIntegration('list-log-integration', listLogLambda);
    httpApi.addRoutes({
      path: ENDPOINTS.api.ListLog,
      authorizer: lambdaAuthorizer,
      methods: [HttpMethod.POST],
      integration: listLogIntegration,
    })

    // Outputs
    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, 'IdentityPoolId', { value: identityPool.ref });
    new CfnOutput(this, 'BucketName', { value: logsBucket.bucketName });
    new CfnOutput(this, 'ApiEndpoint', { value: httpApi.url || '' });
  }
}

const app = new App();
new HandTermCdkStack(app, 'HandTermCdkStack');