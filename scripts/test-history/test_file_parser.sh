#!/bin/bash

# Input file is the first argument
input_file="$1"

# Check if the file exists
if [ ! -f "$input_file" ]; then
  echo "Error: Input file '$input_file' not found." >&2 # Output to stderr
  exit 1
fi

# Extract commit hash from filename
commit_hash=$(basename "$input_file" | cut -d'_' -f3 | cut -d'.' -f1)

# Define output file
output_file="e2e_results_$commit_hash.csv"

# Write header to output file
echo "Test,Status,Time" > "$output_file"

# Check for the "Running..." line to determine if tests ran *at all*
if grep -q "Running" "$input_file"; then
  # Extract total tests from the "Running..." line
  total_tests=$(grep -m 1 "Running" "$input_file" | awk '{print $2}')

  # Count passed, failed and skipped tests
  passed_tests=$(grep -cE '^  ✓' "$input_file")
  failed_tests=$(grep -cE '^  ✘' "$input_file")
  skipped_tests=$(grep -cE '^  -' "$input_file")

  # Extract and write individual test results
  grep -E '^(  ✓|  ✘|  -)' "$input_file" | while read -r line; do
    if [[ "$line" == *"✓"* ]]; then
      status="PASSED"
    elif [[ "$line" == *"✘"* ]]; then
      status="FAILED"
    elif [[ "$line" == *"-"* ]]; then
      status="SKIPPED"
    else
      status="UNKNOWN" # Should not happen, but good practice
    fi
    test_info=$(echo "$line" )
    echo "$test_info,$status" >> "$output_file"
  done

  # Output summary in CSV format
  echo "$commit_hash,$total_tests,$passed_tests,$failed_tests,$skipped_tests,SUCCESS"
else
  # Output ERROR in CSV format
  echo "$commit_hash,0,0,0,0,ERROR"
fi