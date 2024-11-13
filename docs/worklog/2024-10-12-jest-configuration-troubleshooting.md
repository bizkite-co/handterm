# Jest Matcher Extension Troubleshooting

## Matcher Extension Challenge

During test suite configuration, we encountered an issue with extending Jest matchers from Testing Library.

### Problem
- Importing all matchers with `import * as matchers` caused extension errors
- `expect.extend()` failed due to incorrect matcher format

### Solution
- Reverted to importing specific matchers directly
- Used explicit matcher extension with `toBeInTheDocument`
- Maintained existing global testing function extensions

### Rationale
- Ensures reliable matcher extension
- Provides a more predictable testing library integration
- Preserves existing test setup infrastructure

### Technical Details
- Specific import: `import { toBeInTheDocument } from '@testing-library/jest-dom/matchers'`
- Extension method: `jestExpect.extend({ toBeInTheDocument })`

## Next Steps
- Verify test suite runs successfully
- Monitor for any additional testing configuration issues
