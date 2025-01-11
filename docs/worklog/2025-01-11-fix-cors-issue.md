# 2025-01-11 Fix CORS Issue

## Task
There is a CORS issue between the handterm web app (localhost:5173) and the handterm-cdk API Gateway endpoint (drypicnke5.execute-api.us-east-1.amazonaws.com). When refreshing the page after login, the /getUser endpoint fails with a CORS error.

## Problem Understanding
The error indicates that the API Gateway endpoint is not properly configured to allow requests from localhost:5173. The preflight OPTIONS request is failing because the required CORS headers are not present.

## Plan
1. Examine the CDK configuration for the API Gateway endpoint to ensure proper CORS headers are configured
2. Check the apiClient.ts implementation to see how requests are made
3. Review useAuth.ts to understand how authentication state is managed
4. Implement necessary changes to fix the CORS configuration

## Next Steps
1. Read the CDK configuration for the API Gateway endpoint
2. Analyze the apiClient.ts implementation
3. Review useAuth.ts authentication flow
4. Implement CORS fixes
