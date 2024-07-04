// cdk/lambda/userStorage/saveLog.ts

import * as AWS from 'aws-sdk';

const s3 = new AWS.S3();

exports.handler = async (event:any) => {
    console.log('SaveLogFuntion called');
    console.log('event', event);
    console.log('authorizer', event.requestContext.authorizer.lambda);
    const userId = event.requestContext.authorizer.lambda.userId;
    console.log('userId:', userId);
    const { key, content } = JSON.parse(event.body); // Example payload
    console.log('userId:', userId, 'key:', key, 'content:', content);

    const bucketName = 'handterm';

    try {
        await s3.putObject({
            Bucket: bucketName,
            Key: `user_data/${userId}/logs/${key}.json`,
            Body: content,
        }).promise();

        return { statusCode: 200, body: JSON.stringify({ message: 'Log saved' }) };
    } catch (err) {
        console.log('Error:', err);
        return { statusCode: 500, body: JSON.stringify(err) };
    }
};