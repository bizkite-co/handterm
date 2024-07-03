
import * as AWS from 'aws-sdk';
const s3 = new AWS.S3();

exports.handler = async (event: any) => {
    console.log('event:', event, 'userId:', event.requestContext.authorizer.userId);
    const userId = event.requestContext.authorizer.userId;
    const bucketName = 'handterm';

    try {
        await s3.getObject({
            Bucket: bucketName,
            Key: `logs/${userId}/*.*`
        }).promise();

        return { statusCode: 200, body: JSON.stringify({ message: 'Log saved' }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify(err) };
    }
};