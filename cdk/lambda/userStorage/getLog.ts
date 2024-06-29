
import * as AWS from 'aws-sdk';
const s3 = new AWS.S3();

exports.handler = async (event: { body: string; }) => {
    const { logData, userId } = JSON.parse(event.body); // Example payload
    const bucketName = 'handterm';

    try {
        await s3.getObject({
            Bucket: bucketName,
            Key: `logs/${userId}/${Date.now()}.txt`
        }).promise();

        return { statusCode: 200, body: JSON.stringify({ message: 'Log saved' }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify(err) };
    }
};