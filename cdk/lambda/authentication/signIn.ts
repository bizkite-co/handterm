// cdk/lambda/authentication/signIn.ts
import * as AWS from 'aws-sdk';
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });
exports.handler = async (event: { body: string }) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  console.log('SignIn body:', body);
  let response = {statusCode: 400, headers: {}, body: '', log: new Array<string>()};
  try {
    const { username, password } = body;
    // Ensure ClientId is a string and not undefined
    const clientId = process.env.COGNITO_APP_CLIENT_ID;
    response.log.push(`ClientId: ${clientId}`);
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

    const { IdToken, AccessToken, RefreshToken } = data.AuthenticationResult ?? {};

    if (!IdToken || !AccessToken || !RefreshToken) {
      // Handle the missing tokens scenario, perhaps by throwing an error or returning an error response
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Authentication failed or incomplete." }),
      };
    }

    // Concatenate the Set-Cookie strings into a single header value
    const setCookieHeader = [
      `idToken=${IdToken}; Secure; HttpOnly; Path=/`,
      `accessToken=${AccessToken}; Secure; HttpOnly; Path=/`,
      `refreshToken=${RefreshToken}; Secure; HttpOnly; Path=/`
    ].join(', ');
    response.body = JSON.stringify(data.AuthenticationResult);
    response.statusCode = 200;
    response.headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Set-Cookie": setCookieHeader,
    }
    return response;
  } catch (err: any) {
    console.error('SignIn error:', err);
    response.statusCode = 400;
    response.headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    };
    response.body = JSON.stringify(err.message);
    response.log.push(err.message);

    return response;
  }
};