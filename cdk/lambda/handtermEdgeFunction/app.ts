// cdk/lib/app.ts

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

import { CloudFrontResponseEvent, CloudFrontResponseHandler, CloudFrontResponseResult } from 'aws-lambda';

export const lambdaHandler: CloudFrontResponseHandler = async (event: CloudFrontResponseEvent): Promise<CloudFrontResponseResult> => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  // Set HttpOnly Cookie
  headers['set-cookie'] = [{
    key: 'Set-Cookie',
    value: `handterm-history=YourCookieValue; Path=/; Secure; HttpOnly;`
  }];

  return response;
};