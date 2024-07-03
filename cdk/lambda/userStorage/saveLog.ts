// cdk/lambda/userStorage/saveLog.ts

import * as AWS from 'aws-sdk';

const s3 = new AWS.S3();

exports.handler = async (event:any) => {
    console.log('event', event);
    const userId = event.requestContext.authorizer.userId;

    const { logData } = JSON.parse(event.body); // Example payload
    const bucketName = 'handterm';

    try {
        await s3.putObject({
            Bucket: bucketName,
            Key: `logs/${userId}/${Date.now()}.json`,
            Body: logData,
        }).promise();

        return { statusCode: 200, body: JSON.stringify({ message: 'Log saved' }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify(err) };
    }
};