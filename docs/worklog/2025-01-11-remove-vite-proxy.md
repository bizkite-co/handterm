# Remove Vite Proxy Configuration

## Task
Remove the Vite proxy configuration since it's not compatible with GitHub Pages deployment and both development and production should access the API Gateway directly.

## Problem Understanding
- The current Vite proxy configuration rewrites /api requests to the AWS API Gateway endpoint
- This proxy only works during development and won't function in production on GitHub Pages
- Both environments should access the API Gateway directly
- The endpoints.json file already contains the full API Gateway URL

## Plan
1. Remove the proxy configuration from vite.config.ts
2. Update apiClient.ts to use endpoints directly from endpoints.json
3. Ensure CORS is properly configured on the API Gateway side

## Next Steps
- Remove server.proxy configuration from vite.config.ts
- Verify API calls work correctly in both development and production
- Test CORS functionality

## Implementation
```typescript
// Removed proxy configuration from vite.config.ts
// server: {
//   proxy: {
//     '/api': {
//       target: 'https://drypicnke5.execute-api.us-east-1.amazonaws.com',
//       changeOrigin: true,
//       secure: false,
//       rewrite: (path) => path.replace(/^\/api/, ''),
//       headers: {
//         'Access-Control-Allow-Origin': 'http://localhost:5173',
//         'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
//         'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//         'Access-Control-Allow-Credentials': 'true'
//       }
//     }
//   }
// }
```

## Verification
- [ ] Test API calls in development environment
- [ ] Test API calls in production environment
- [ ] Verify CORS headers are properly configured on API Gateway
