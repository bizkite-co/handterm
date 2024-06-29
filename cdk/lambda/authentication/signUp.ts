const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider({region: 'us-east-1'});

exports.handler = async (event: { body: string; }) => {
  console.log("signUp function called");
  console.log('Received event:', event); // Log the incoming event

  try {
    const {username, password, email} = JSON.parse(event.body);
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
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err: any) {
    console.error('SignUp error:', err); // Log any errors that occur
    return { statusCode: 400, body: JSON.stringify(err.message) };
  }
};