// cdk/lambda/authentication/checkConnection.ts

import * as AWS from 'aws-sdk';
import { ENDPOINTS } from '../../cdkshared/endpoints';
import * as jwt from 'jsonwebtoken';

const s3 = new AWS.S3({ region: 'us-east-1' });
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });


function parseCookies(cookieHeader: string) {
    const cookies: { [key: string]: string } = {};
    cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
    });
    return cookies;
}

function decodeToken(token: string) {
    return jwt.decode(token);
}

export const handler = async (event: any) => {
    const cookies = event.headers['Cookie'] || event.headers['cookie'];
    let response = { statusCode: 401, body: 'Unauthorized', log: 'init\r' };
    try {
        // Parse the cookies to extract needed tokens
        const idToken = parseCookies(cookies).idToken;
        response.log += `idToken: ${idToken}\r`;
        // Identify the user from the token and proceed with S3 operations
        const decodedToken = decodeToken(idToken);
        if (!decodedToken) {
            // Handle the case where the token cannot be decoded
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid token" }) };
        }

        // If the token is successfully decoded, proceed with using the decodedToken object
        const userId = decodedToken.sub;
        response.log += `userId: ${userId}\r`;
        // Example S3 operation
        const objectKey = `user_data/${userId}/data.txt`;
        response.log += `objectKey: ${objectKey}\r`;
        const s3Response = await s3.getObject({ Bucket: ENDPOINTS.aws.s3.bucketName, Key: objectKey }).promise();
        response.log += `s3Response: ${s3Response}\r`;
        // If the file is found, return its content
        const fileContent = s3Response.Body?.toString('utf-8');
        response.log += `fileContent: ${fileContent}\r`;
        response.statusCode = 200;
        response.body = JSON.stringify({ userId: userId, content: fileContent });
        return response;
    } catch (err) {
        response.statusCode = 500;

        return { statusCode: 500, body: JSON.stringify(err) };
    }
}