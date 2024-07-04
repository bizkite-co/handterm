
import * as AWS from 'aws-sdk';
import { ENDPOINTS } from '../cdkshared/endpoints';
const s3 = new AWS.S3();

exports.handler = async (event: any) => {
    console.log('event:', event, 'userId:', event.requestContext.authorizer.userId);
    const userId = event.requestContext.authorizer.lambda.userId;
    const bucketName = ENDPOINTS.aws.s3.bucketName;

    try {
        const { Contents } = await s3.listObjectsV2({
            Bucket: bucketName,
            Prefix: `user_data/${userId}/logs/`,
        }).promise();

        return { statusCode: 200, body: JSON.stringify({ body: Contents }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify(err) };
    }
}