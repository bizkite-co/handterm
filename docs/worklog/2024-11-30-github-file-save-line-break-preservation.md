# GitHub File Save Line Break Preservation

## Problem
When saving files edited in Vim through the AWS Lambda function, line breaks were being converted to text representations, causing formatting issues.

## Solution
Modified the `saveRepoFile` function in `githubUtils.ts` to use explicit UTF-8 encoding when converting content to base64:

```typescript
const base64Content = Buffer.from(options.content, 'utf8').toString('base64');
```

This change ensures that line breaks are preserved exactly as they were in the original content, maintaining the file's formatting when saved to GitHub.

## Impact
- Preserves original file formatting
- Maintains line breaks from Vim editing
- Ensures consistent file representation across save operations

## Date
2024-11-30
