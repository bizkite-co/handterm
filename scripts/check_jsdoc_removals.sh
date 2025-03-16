#!/bin/bash

# Check for JSDoc removals in the working directory and staging area
if git diff | grep -q '^- \*' || git diff --cached | grep -q '^- \*'; then
  echo "Error: JSDoc removals detected. Please review the changes."
  exit 1
fi

if git diff | grep -q '^-/\*\*' || git diff --cached | grep -q '^-/\*\*'; then
  echo "Error: JSDoc removals detected. Please review the changes."
  exit 1
fi

echo "No JSDoc removals detected."
exit 0