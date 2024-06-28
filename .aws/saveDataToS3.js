const AWS = require('aws-sdk');
const s3 = new AWS.S3();

export const saveDataToS3 = async (bucketName, key, data) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: JSON.stringify(data),
  };
  return s3.putObject(params).promise();
};