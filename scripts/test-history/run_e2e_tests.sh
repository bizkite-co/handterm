#!/bin/bash

echo "Script started"

# Create a temp directory to store the raw output of each test run
mkdir -p temp

for i in {0..9}; do
  # Get the abbreviated commit hash
  commit_hash=$(git rev-parse --short HEAD~"$i")

  # Define the output file path for the current commit
  output_file="temp/e2e_output_$commit_hash.txt"

  # Check if the output file exists and has content
  if [ ! -s "$output_file" ]; then
    # Checkout the commit
    git checkout HEAD~"$i" --quiet

    # Run tests and save raw output to the file
    echo "Running tests for commit $commit_hash"
    npm run test:e2e > "$output_file" 2>&1

    # Checkout back to the main branch after each test run
    git checkout - --quiet
  else
    echo "Skipping tests for commit $commit_hash (output file exists)"
  fi

done

echo "E2E test runs completed (or skipped if output files existed)."