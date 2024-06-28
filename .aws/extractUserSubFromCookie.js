const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
  try {
    // Assume the session token or user ID is stored in the HttpOnly cookie
    // You need to extract and validate it. Here, we just show a placeholder.
    const userSub = extractUserSubFromCookie(event.headers.Cookie);

    // Assuming you have the user's sub (unique identifier), fetch user details from Cognito
    const userPoolId = 'yourUserPoolId';
    const params = {
      UserPoolId: userPoolId,
      Filter: `sub = "${userSub}"`,
    };

    const userData = await cognito.listUsers(params).promise();
    if (userData.Users.length > 0) {
      const user = userData.Users[0];
      // Simplify the response for the example
      return {
        statusCode: 200,
        body: JSON.stringify({
          username: user.Username,
          attributes: user.Attributes,
        }),
      };
    } else {
      return { statusCode: 404, body: 'User not found' };
    }
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Server error' };
  }
};

// Placeholder function for extracting user identifier from cookie
function extractUserSubFromCookie(cookieHeader) {
  // Implement cookie parsing to extract the session/user identifier
  return 'extractedSub';
}