// cdk/lambda/authentication/checkConnection.ts
import * as AWS from 'aws-sdk';
const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

export const handler = async (event: any) => {
    const { username, password } = JSON.parse(event.body);
    const user = {
        Username: username,
        Pool: cognito
    };
    try {
        await cognito
            .adminInitiateAuth({
                AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
                ClientId: '5j8b5k9q0m9qf7j5b3k5s2j0',
                UserPoolId: 'us-east-1_3q5q5j5q5q',
                AuthParameters: {
                    USERNAME: username,
                    PASSWORD: password
                }
            })
            .promise();
        return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify(err) };
    }
}