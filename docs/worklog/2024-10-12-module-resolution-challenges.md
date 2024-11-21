# Module Resolution Challenges

## Problem Description
Our project uses a mix of ESM and CommonJS modules, leading to several challenges:

1. ESM modules like @octokit/rest causing errors in AWS Lambda
2. Dynamic imports not being properly tested locally
3. Mocking ESM modules in tests

## Technical Details

### ESM in AWS Lambda
The error we encountered:
```
Error [ERR_REQUIRE_ESM]: require() of ES Module /opt/nodejs/node_modules/@octokit/rest/dist-src/index.js not supported.
Instead change the require of index.js in /var/task/listRecentRepos.js to a dynamic import() which is available in all CommonJS modules.
```

This occurred because:
1. @octokit/rest is an ESM module
2. Our Lambda was trying to use require() to load it
3. The bundling process wasn't properly handling the dynamic import

### Testing Strategy
To properly test ESM modules in Lambda:

1. Create mock implementations that match the module's interface:
```javascript
// Mock Octokit
exports.Octokit = class {
    constructor() {
        console.log('Mock Octokit constructed');
    }

    repos = {
        listForAuthenticatedUser: async () => ({
            data: [{
                name: 'test-repo',
                full_name: 'test-user/test-repo',
                description: 'Test repository',
                html_url: 'https://github.com/test-user/test-repo',
                updated_at: '2024-03-19T00:00:00Z'
            }]
        })
    };
};
```

2. Use esbuild's alias feature to replace imports during bundling:
```json
{
  "bundle-lambda-test": "esbuild ... --alias:@octokit/rest=/path/to/mock-octokit.js"
}
```

3. Test the actual bundled output to match production:
```javascript
const lambdaPath = resolve(__dirname, '../../dist/lambda/authentication/listRecentRepos.js');
const { handler } = await import(lambdaPath);
```

### Solution Implemented
1. Moved @octokit/rest to dependencies since it's needed in production
2. Used dynamic import in Lambda code:
```typescript
const { Octokit } = await import('@octokit/rest');
```

3. Created comprehensive mocks for testing:
- AWS SDK commands (GetUserCommand, AdminGetUserCommand)
- GitHub utilities
- Octokit REST client

4. Updated bundling configuration:
- Use proper aliases for module replacement
- Bundle in the correct format
- Handle both ESM and CommonJS modules

## Key Learnings
1. When using ESM modules in Lambda:
   - Use dynamic import() instead of require()
   - Ensure the bundling process preserves the dynamic import
   - Test the actual bundled output

2. For testing:
   - Mock at the module level using esbuild aliases
   - Provide complete mock implementations
   - Test the full flow including all dependencies

3. Bundle testing:
   - Test the actual bundled output
   - Use the same format as production
   - Mock external dependencies consistently

## Next Steps
1. Consider creating a Lambda layer for @octokit/rest to reduce cold start time
2. Add more comprehensive tests for token refresh scenarios
3. Document ESM module usage patterns for future Lambda functions
