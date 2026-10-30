#!/bin/sh
# Git pre-push hook: ensures unit tests pass before pushing.
# Bypass in emergency via: git push --no-verify

echo "==> Running pre-push checks (unit tests)..."

npm test || {
  echo >&2 "❌ Unit tests failed. Push aborted. Fix test failures or push with --no-verify."
  exit 1
}

echo "✅ Pre-push verification passed."
exit 0
