// cdk/lambda/userStorage/saveLog.ts

import * as AWS from 'aws-sdk';

const s3 = new AWS.S3();

exports.handler = async (event:any) => {
    const userId = event.requestContext.authorizer.lambda.userId;
    const { key, content } = JSON.parse(event.body); // Example payload
    console.log('userId:', userId, 'key:', key);

    const bucketName = 'handterm';
    // TODO: replace('_', '/') to partition by folder, which is S3-optimal.
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