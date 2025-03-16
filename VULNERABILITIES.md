# Known Vulnerabilities

## esbuild (GHSA-67mh-4wv8-2f99)

**Description:** esbuild enables any website to send any requests to the development server and read the response.

**Affected Package:** `esbuild` (indirect dependency via `vite`)

**Affected Versions:** <=0.24.2

**Severity:** Moderate

**Impact:** This vulnerability only affects the development environment, not production builds. A malicious website could potentially access files or information from the development environment if the developer visits that website while the development server is running.

**Fix:** No fix is currently available for the affected versions of `esbuild`.

**Recommendation:** Exercise caution when opening untrusted websites during development. Avoid visiting potentially malicious websites while the development server is running.

**References:**

*   GitHub Advisory Database: [https://github.com/advisories/GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)

## Test Failures

**Description:** The current test suite is failing due to dependency conflicts introduced by using `npm install --legacy-peer-deps`. This was done to work around the original `npm audit` error ("Cannot read properties of null (reading 'edgesOut')"), but it has resulted in incompatible package versions.

**Recommendation:** Do not use `npm install --legacy-peer-deps` unless absolutely necessary, as it can lead to broken installations and test failures. Further investigation and manual dependency resolution are required to fix the tests.