// cdk/lambda/authentication/signIn.ts

import * as AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

exports.handler = async (event: { body: string }) => {
  console.log('SignIn received event:', event);

  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  console.log('SignIn body:', body);
  try {
    const { username, password } = body;
    // Ensure ClientId is a string and not undefined
    const clientId = process.env.COGNITO_APP_CLIENT_ID;
    if (!clientId) {
      throw new Error('COGNITO_APP_CLIENT_ID environment variable is not set.');
    }
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };
    body.params = params;
    const data = await cognito.initiateAuth(params).promise();
    
    console.log('SignIn success:', JSON.stringify(data));
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(data.AuthenticationResult),
    };
  } catch (err: any) {
    console.error('SignIn error:', err);
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: { message: JSON.stringify(err.message), eventBody: body},
    };
  }
};