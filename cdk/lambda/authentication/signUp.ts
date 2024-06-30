// cdk/lambda/authentication/signUp.ts

const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

exports.handler = async (event: { body: string; }) => {
  console.log("signUp function called");
  console.log('Received event:', event); // Log the incoming event

  try {
    const { username, password, email } = JSON.parse(event.body);
    console.log(`Processing signUp for username: ${username}, email: ${email}`); // Log the extracted variables

    var params = {
      ClientId: process.env.COGNITO_APP_CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
      ],
    };

    const data = await cognito.signUp(params).promise();
    console.log('SignUp success:', JSON.stringify(data)); // Log successful signup
    // Include CORS headers in the successful response
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Adjust this value based on your requirements
        "Access-Control-Allow-Credentials": true, // If your client needs to handle cookies
      },
      body: JSON.stringify(data)
    };
  } catch (err: any) {
    console.error('SignUp error:', err); // Log any errors that occur
    // Include CORS headers in the error response
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Adjust this value based on your requirements
        "Access-Control-Allow-Credentials": true, // If your client needs to handle cookies
      },
      body: JSON.stringify(err.message)
    };
  }
};