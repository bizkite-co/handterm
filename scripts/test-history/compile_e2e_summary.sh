#!/bin/bash

echo "Script started"

# Clear the summary CSV file
truncate -s 0 e2e_results_summary.csv

# Add header - including SkippedTests
echo "Commit,TotalTests,PassedTests,SkippedTests,Status" >> e2e_results_summary.csv

# Loop through the output files in the temp directory
for output_file in temp/e2e_output_*.txt; do
  # Call test_file_parser.sh and append its output to the summary CSV
  ./test_file_parser.sh "$output_file" >> e2e_results_summary.csv
done

echo "E2E test results summary saved to e2e_results_summary.csv"