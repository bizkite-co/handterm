// cdk/lambda/authentication/checkConnection.ts

import * as AWS from 'aws-sdk';

const s3 = new AWS.S3({ region: 'us-east-1' });
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });


export const handler = async (event: any) => {
    console.log('getUser received event:', event);
    let response = { statusCode: 401, body: 'Unauthorized', log: 'init\r' };
    try {
        console.log('event.headers: ', event.headers);
        const cookies = event.headers['Cookies'] || event.headers['cookies'];
        console.log('cookies: ', cookies);
        // Parse the cookies to extract needed tokens
        const accessToken = cookies["accessToken"]; // Consider renaming if using an actual access token
        console.log('accessToken: ', accessToken);
        response.log += `accessToken: ${accessToken}\r`;

        // Identify the user from the token and proceed with S3 operations
        // Use the accessToken to get user information from Cognito
        const user = await cognito.getUser({
            AccessToken: accessToken
        }).promise();

        const userId = user.Username;
        console.log('userId: ', userId);
        response.log += `userId: ${userId}\r`;
        // Example S3 operation
        const objectKey = `user_data/${userId}/data.txt`;

        response.log += `objectKey: ${objectKey}\r`;
        const s3Response = await s3.getObject({ Bucket: 'handterm', Key: objectKey }).promise();
        response.log += `s3Response: ${s3Response}\r`;
        console.log('s3Response: ', s3Response);
        // If the file is found, return its content
        const fileContent = s3Response.Body?.toString('utf-8');
        response.log += `fileContent: ${fileContent}\r`;
        console.log('fileContent: ', fileContent);
        response.statusCode = 200;
        response.body = JSON.stringify({ userId: userId, content: fileContent });
        return response;
    } catch (err) {
        response.statusCode = 500;
        return { statusCode: 500, body: JSON.stringify(err) };
    }
}